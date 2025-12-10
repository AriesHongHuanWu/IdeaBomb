import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import Whiteboard from './Whiteboard'
import ChatInterface from './ChatInterface'
import ShareModal from './ShareModal'
import { db, auth } from '../firebase'
import { collection, onSnapshot, setDoc, doc, updateDoc, deleteDoc, arrayUnion, writeBatch } from 'firebase/firestore'
import { FiHome, FiUserPlus, FiDownload, FiEye, FiEyeOff, FiMenu } from 'react-icons/fi'
import { signOut } from 'firebase/auth'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { useMediaQuery } from '../hooks/useMediaQuery'

export default function BoardPage({ user }) {
    const { boardId } = useParams()
    const navigate = useNavigate()
    const [nodes, setNodes] = useState([])
    const [edges, setEdges] = useState([])
    const [boardTitle, setBoardTitle] = useState('Loading...')
    const [collaborators, setCollaborators] = useState([])
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [hasAccess, setHasAccess] = useState(true)
    const [activePage, setActivePage] = useState('Page 1')
    const [pages, setPages] = useState(['Page 1'])
    const [lastAIAction, setLastAIAction] = useState(null)
    const [clipboard, setClipboard] = useState(null)
    const [cursors, setCursors] = useState({})
    const [isIncognito, setIsIncognito] = useState(false)
    const [confirmModal, setConfirmModal] = useState(null) // { title, message, onConfirm }
    const throttleRef = useRef(Date.now())
    const isMobile = useMediaQuery('(max-width: 768px)')
    const [pageConfigs, setPageConfigs] = useState({})

    // --- Data Sync ---
    useEffect(() => {
        if (!boardId || !user) return
        const unsub = onSnapshot(doc(db, 'boards', boardId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()
                setBoardTitle(data.title); const isOwner = data.createdBy === user.uid;
                const isAllowed = data.allowedEmails?.some(e => e.toLowerCase() === (user.email || '').toLowerCase()) || isOwner;
                if (data.allowedEmails && !isAllowed) { setHasAccess(false) } else { setHasAccess(true) }
                if (data.pageConfigs) setPageConfigs(data.pageConfigs)
            } else { setBoardTitle('Board Not Found') }
        }, (error) => { if (error.code === 'permission-denied') setHasAccess(false) })
        return unsub
    }, [boardId, user])

    const updateCanvasSize = async (w, h) => {
        if (!boardId || !hasAccess) return
        try {
            // Using dot notation for specific map field update
            // Note: If page name has dots, this might be tricky, but default names are "Page X"
            await updateDoc(doc(db, 'boards', boardId), {
                [`pageConfigs.${activePage}`]: { w, h }
            })
        } catch (e) {
            console.error("Error updating canvas size:", e)
        }
    }


    useEffect(() => {
        if (!boardId || !hasAccess) return
        const unsub = onSnapshot(collection(db, 'boards', boardId, 'nodes'), (snapshot) => {
            const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() })); setNodes(loaded)
            const nodePages = new Set(loaded.map(n => n.page).filter(p => p)); if (nodePages.size > 0) { setPages(prev => Array.from(new Set([...prev, ...nodePages])).sort()) }
        })
        return unsub
    }, [boardId, hasAccess])

    useEffect(() => {
        if (!boardId || !hasAccess) return
        const unsub = onSnapshot(collection(db, 'boards', boardId, 'edges'), (snapshot) => {
            setEdges(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        })
        return unsub
    }, [boardId, hasAccess])

    // --- Cursors ---
    useEffect(() => {
        if (!boardId || !hasAccess) return
        const unsub = onSnapshot(collection(db, 'boards', boardId, 'cursors'), (snapshot) => {
            const c = {}; snapshot.docs.forEach(d => { if (d.id !== user.uid) c[d.id] = d.data() })
            setCursors(c)
        })
        return unsub
    }, [boardId, hasAccess, user])

    // Stable User Color
    const userColor = useRef('#' + Math.floor(Math.random() * 16777215).toString(16))

    const handleCursorMove = (x, y) => {
        if (isIncognito || !user || Date.now() - throttleRef.current < 200) return
        throttleRef.current = Date.now()
        setDoc(doc(db, 'boards', boardId, 'cursors', user.uid), {
            x, y, uid: user.uid, displayName: user.displayName, photoURL: user.photoURL,
            color: userColor.current, page: activePage,
            lastActive: new Date().toISOString()
        })
    }

    useEffect(() => {
        if (!user || !boardId || !hasAccess) return

        // Initial set
        const userRef = doc(db, 'boards', boardId, 'presence', user.uid)
        setDoc(userRef, { uid: user.uid, photoURL: user.photoURL, displayName: user.displayName, lastActive: new Date().toISOString() })

        // Heartbeat every 30s
        const interval = setInterval(() => {
            updateDoc(userRef, { lastActive: new Date().toISOString() }).catch(() => { })
        }, 30000)

        const unsub = onSnapshot(collection(db, 'boards', boardId, 'presence'), (snap) => {
            // Filter out stale users (inactive loop > 2 min)? Or just store all and let UI decide.
            // Let's just store all for now, maybe filter in UI.
            setCollaborators(snap.docs.map(d => d.data()))
        })

        return () => { clearInterval(interval); unsub() }
    }, [user, boardId, hasAccess])

    // --- Core Operations ---
    const handleAIRequest = async (nodeId, type) => {
        const node = nodes.find(n => n.id === nodeId)
        if (!node) return
        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
            const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash-lite" })
            const prompt = `Improve the following text for a whiteboard note (make it clearer/better): "${node.content}"\nReturn ONLY the improved text.`
            const result = await model.generateContent(prompt)
            const text = result.response.text().trim()
            await updateDoc(doc(db, 'boards', boardId, 'nodes', nodeId), { content: text })
        } catch (e) {
            console.error(e)
            if (e.message.includes('429') || e.toString().includes('429')) {
                alert("✨ AI Brain needs a moment! (Rate Limit Reached)\nPlease wait 1 minute before trying again.")
            } else {
                alert("AI Error: " + e.message)
            }
        }
    }

    const addNode = async (type, content, extraData = {}) => {
        if (!user || !hasAccess) return null
        if (nodes.length >= 200) { alert("Maximum stickies limit reached (200). Please delete some to add more."); return null }
        const newNode = { id: uuidv4(), type: type || 'Note', page: activePage, x: extraData.x || (window.innerWidth / 2), y: extraData.y || (window.innerHeight / 2), content: content || '', items: [], events: extraData.events || {}, src: '', videoId: '', createdAt: new Date().toISOString(), createdBy: user.uid, ...extraData }
        try { await setDoc(doc(db, 'boards', boardId, 'nodes', newNode.id), newNode); return newNode.id } catch (e) { console.error("Error adding node:", e); return null }
    }

    const addEdge = async (fromId, toId) => {
        if (fromId === toId) return
        const id = uuidv4()
        await setDoc(doc(db, 'boards', boardId, 'edges', id), { id, from: fromId, to: toId, page: activePage })
    }

    const updateNodePosition = async (id, offset) => {
        // Optimistic Update
        setNodes(prev => prev.map(n => n.id === id ? { ...n, x: n.x + offset.x, y: n.y + offset.y } : n));

        const node = nodes.find(n => n.id === id);
        if (!node) return;
        try {
            await updateDoc(doc(db, 'boards', boardId, 'nodes', id), { x: node.x + offset.x, y: node.y + offset.y })
        } catch (e) {
            console.error(e)
        }
    }
    const updateNodeData = async (id, data) => { try { await updateDoc(doc(db, 'boards', boardId, 'nodes', id), data) } catch (e) { console.error(e) } }
    const deleteNode = async (id) => {
        const batch = writeBatch(db)
        batch.delete(doc(db, 'boards', boardId, 'nodes', id))
        edges.filter(e => e.from === id || e.to === id).forEach(e => batch.delete(doc(db, 'boards', boardId, 'edges', e.id)))
        await batch.commit()
    }
    const batchUpdateNodes = async (updates) => { if (!updates.length) return; const batch = writeBatch(db); updates.forEach(({ id, data }) => batch.update(doc(db, 'boards', boardId, 'nodes', id), data)); await batch.commit() }
    const handleBatchDelete = async (ids) => {
        if (!ids.length) return

        setConfirmModal({
            title: `Delete ${ids.length} items?`,
            message: 'Are you sure you want to delete these items?',
            onConfirm: async () => {
                const batch = writeBatch(db)
                const deleteEdgeIds = edges.filter(e => ids.includes(e.from) || ids.includes(e.to)).map(e => e.id)
                ids.forEach(id => batch.delete(doc(db, 'boards', boardId, 'nodes', id)))
                deleteEdgeIds.forEach(id => batch.delete(doc(db, 'boards', boardId, 'edges', id)))
                await batch.commit()
                setConfirmModal(null)
            }
        })
    }

    const batchMoveToPage = async (ids, targetPage) => {
        const batch = writeBatch(db)
        ids.forEach(id => batch.update(doc(db, 'boards', boardId, 'nodes', id), { page: targetPage }))
        edges.filter(e => ids.includes(e.from) || ids.includes(e.to)).forEach(e => batch.update(doc(db, 'boards', boardId, 'edges', e.id), { page: targetPage }))
        await batch.commit()
        setActivePage(targetPage)
    }

    const copyNodes = (ids) => {
        const toCopy = nodes.filter(n => ids.includes(n.id))
        const relatedEdges = edges.filter(e => ids.includes(e.from) && ids.includes(e.to))
        setClipboard({ nodes: toCopy, edges: relatedEdges })
        alert(`Copied ${toCopy.length} items`)
    }

    const pasteNodes = async (atX, atY) => {
        if (!clipboard || !clipboard.nodes.length) return
        const batch = writeBatch(db)
        const minX = Math.min(...clipboard.nodes.map(n => n.x)); const minY = Math.min(...clipboard.nodes.map(n => n.y))
        const idMap = {}
        clipboard.nodes.forEach(node => {
            const newId = uuidv4()
            idMap[node.id] = newId
            const offsetX = node.x - minX; const offsetY = node.y - minY
            const finalX = atX !== undefined ? atX + offsetX : node.x + 50
            const finalY = atY !== undefined ? atY + offsetY : node.y + 50
            batch.set(doc(db, 'boards', boardId, 'nodes', newId), { ...node, id: newId, page: activePage, x: finalX, y: finalY, createdAt: new Date().toISOString(), createdBy: user.uid })
        })
        clipboard.edges.forEach(edge => {
            if (idMap[edge.from] && idMap[edge.to]) {
                const newEdgeId = uuidv4()
                batch.set(doc(db, 'boards', boardId, 'edges', newEdgeId), { id: newEdgeId, from: idMap[edge.from], to: idMap[edge.to], page: activePage })
            }
        })
        await batch.commit()
    }

    const handleAIAction = async (actions) => {
        const actionList = Array.isArray(actions) ? actions : [actions]
        const createdIds = [];
        const pageNodes = nodes.filter(n => (n.page || 'Page 1') === activePage)

        // Pass 1: Creation, Update & Deletion
        const batch = writeBatch(db)
        const idMap = {} // Local ID -> Real Firestore ID

        // Layout State
        const nodeCache = { ...Object.fromEntries(pageNodes.map(n => [n.id, n])) } // ID -> Node Object (with x,y,w,h)
        const siblingTracker = {} // parentId -> currentYOffset (for stacking siblings)

        // Find the "Frontier" (Rightmost X) to start independent chains
        let globalFrontierX = pageNodes.length > 0 ? Math.max(...pageNodes.map(n => n.x + (n.w || 320))) + 100 : 100
        let globalGridCount = 0

        // Helper: Extract YouTube ID
        const getYTId = (u) => { const m = u?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/); return (m && m[2].length === 11) ? m[2] : null }

        for (const a of actionList) {
            // --- CREATION ---
            if (['create_node', 'create_calendar_plan', 'create_video', 'create_link'].includes(a.action)) {
                const newId = uuidv4()
                if (a.id) idMap[a.id] = newId // Map local AI ID (e.g. "n1") to Firestore ID

                let type = a.nodeType || 'Note'
                let content = typeof a.content === 'string' ? a.content : (a.content ? JSON.stringify(a.content) : '')
                let extra = a.data || {}

                // Unified Type Handling
                // Unified Type Handling
                if (a.action === 'create_calendar_plan') { type = 'Calendar'; extra = { events: a.events || {} } }
                else if (a.action === 'create_video') { type = 'YouTube' }
                else if (a.action === 'create_link') { type = 'Link' }

                // Fallback: Check 'nodeType' from JSON
                if (a.nodeType === 'Todo' || a.type === 'Todo') type = 'Todo'
                if (a.nodeType === 'Calendar' || a.type === 'Calendar') type = 'Calendar'
                if (a.nodeType === 'Link' || a.type === 'Link') type = 'Link'

                // Extract Metadata
                if (a.label) extra.label = a.label
                if (a.color) extra.color = a.color

                // --- CONTENT PARSING & CLEANUP ---
                // 1. Link Node: Extract URL from Markdown [Title](URL) or raw text
                if (type === 'Link') {
                    const mdLink = content.match(/\[(.*?)\]\((.*?)\)/)
                    if (mdLink) {
                        content = mdLink[2] // The URL
                        // optional: could set a title field if we had one, but for now just get the URL right
                    }
                    const urlMatch = content.match(/(https?:\/\/[^\s]+)/g)
                    if (urlMatch) content = urlMatch[0] // Extract first URL if mixed text
                    extra.url = content
                }

                // 2. Todo Node: Parse markdown bullets into items
                if (type === 'Todo') {
                    const bullets = content.split('\n').filter(l => l.trim().startsWith('- ') || l.trim().startsWith('* '))
                    if (bullets.length > 0) {
                        extra.items = bullets.map(b => ({ text: b.replace(/^[-*] /, '').trim(), done: false }))
                    }
                }

                // 3. Calendar Node: Parse "Date: Event" or "**Time**: Event" lines
                if (type === 'Calendar') {
                    const lines = content.split('\n')
                    const newEvents = { ...extra.events } // Preserve existing if any

                    lines.forEach(line => {
                        // Regex strategies
                        const fullDateTimeMatch = line.match(/(\d{4}[/-]\d{2}[/-]\d{2})\s+(\d{1,2}:\d{2})/);
                        const dateOnlyMatch = line.match(/(\d{4}[/-]\d{2}[/-]\d{2})/);
                        const timeOnlyMatch = line.match(/(\d{1,2}:\d{2})/);

                        let key = null
                        let cleanContent = line

                        if (fullDateTimeMatch) {
                            // "YYYY-MM-DD HH:MM" -> Key = "YYYY-MM-DD HH:MM" to be unique
                            key = `${fullDateTimeMatch[1].replace(/\//g, '-')} ${fullDateTimeMatch[2]}`
                            cleanContent = line.replace(fullDateTimeMatch[0], '')
                        } else if (dateOnlyMatch) {
                            key = dateOnlyMatch[1].replace(/\//g, '-')
                            cleanContent = line.replace(dateOnlyMatch[0], '')
                        } else if (timeOnlyMatch) {
                            if (line.match(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/)) {
                                key = timeOnlyMatch[0]
                            }
                            cleanContent = line.replace(/[\d:-]+/, '')
                        }

                        if (key) {
                            cleanContent = cleanContent.replace(/[*#\-]/g, '').replace(/^[:\s]+/, '').trim()
                            if (cleanContent) { newEvents[key] = cleanContent }
                        }
                    })
                    extra.events = newEvents
                }
                if (type === 'Todo' && (!extra.items || extra.items.length === 0)) {
                    const lines = content.split('\n')
                    const items = lines
                        .filter(l => l.trim().match(/^[-*] /))
                        .map(l => ({ id: uuidv4(), text: l.replace(/^[-*] /, '').trim(), done: false }))

                    if (items.length > 0) extra.items = items
                }

                // 3. Calendar Node: Parse "YYYY-MM-DD HH:mm: Event" from content if events missing
                if (type === 'Calendar') {
                    if (!extra.events || Object.keys(extra.events).length === 0) {
                        const parsedEvents = {}
                        const lines = content.split('\n')
                        lines.forEach(l => {
                            // Match: 2025-12-10 09:00: Event Desc OR **09:00 - 10:00:** Event
                            // Try simple ISO date first
                            const isoMatch = l.match(/(\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?)\s*[:|-]\s*(.*)/)
                            if (isoMatch) {
                                parsedEvents[isoMatch[1]] = isoMatch[3]
                            }
                        })
                        if (Object.keys(parsedEvents).length > 0) extra.events = parsedEvents
                    }
                }

                if (type === 'YouTube') {
                    const u = a.url || (content.startsWith('http') ? content : '')
                    const vid = a.videoId || getYTId(u) || getYTId(content)
                    if (vid) { extra.videoId = vid; if (!content) content = u }
                }

                // --- LAYOUT LOGIC ---
                let x = 0, y = 0, w = 320, h = 300 // Default dimensions

                // 1. Find a Parent (Source of connection)
                // Look for an edge in this batch where 'to' is THIS node
                const parentEdge = actionList.find(act => act.action === 'create_edge' && act.to === a.id)
                let parentNode = null

                if (parentEdge) {
                    const parentLocalId = parentEdge.from
                    // Try to resolve parent ID: Is it a new node (mapped) or existing?
                    const resolvedParentId = idMap[parentLocalId] || parentLocalId
                    parentNode = nodeCache[resolvedParentId] // Look in cache (contains both old and new)
                }

                if (parentNode) {
                    // CONTEXTUAL PLACEMENT
                    // Stack vertically relative to parent
                    const pId = parentNode.id
                    if (siblingTracker[pId] === undefined) {
                        siblingTracker[pId] = parentNode.y // Start at parent level
                    } else {
                        siblingTracker[pId] += (h + 50) // Increment by height + gap
                    }

                    x = parentNode.x + (parentNode.w || 320) + 100 // Right of parent
                    y = siblingTracker[pId]
                } else {
                    // INDEPENDENT / GLOBAL PLACEMENT
                    const GRID_COLS = 3
                    const col = globalGridCount % GRID_COLS
                    const row = Math.floor(globalGridCount / GRID_COLS)

                    x = globalFrontierX + (col * 350)
                    y = 150 + (row * 400)
                    globalGridCount++
                }

                // Store in Cache for future children
                nodeCache[newId] = { id: newId, x, y, w, h }

                batch.set(doc(db, 'boards', boardId, 'nodes', newId), {
                    id: newId, type: getYTId(content) ? 'YouTube' : type, content, page: activePage, x, y, items: [], events: {}, src: type === 'Embed' ? content : '', videoId: getYTId(content) || '', ...extra,
                    createdAt: new Date().toISOString(), createdBy: user.uid,
                    aiStatus: 'suggested'
                })
                createdIds.push(newId)
            }

            // --- UPDATE ---
            else if (a.action === 'update_node') {
                const targetNode = pageNodes.find(n => n.id === a.id || (n.content && n.content.includes(a.content_match)))
                if (targetNode) {
                    const updates = { aiStatus: 'suggested' }
                    if (a.content) updates.content = a.content
                    if (a.data) Object.assign(updates, a.data)
                    batch.update(doc(db, 'boards', boardId, 'nodes', targetNode.id), updates)

                    // Update Cache in case downstream nodes depend on it (though we don't update w/h here significantly yet)
                    if (a.content) nodeCache[targetNode.id].content = a.content
                }
            }

            // --- DELETION ---
            else if (a.action === 'delete_node') {
                const matches = pageNodes.filter(n => {
                    if (a.id && n.id === a.id) return true
                    if (a.content && n.content && n.content.toLowerCase().includes(a.content.toLowerCase())) return true
                    return false
                })
                matches.forEach(t => {
                    batch.delete(doc(db, 'boards', boardId, 'nodes', t.id))
                    edges.filter(e => e.from === t.id || e.to === t.id).forEach(e => batch.delete(doc(db, 'boards', boardId, 'edges', e.id)))
                    delete nodeCache[t.id]
                })
            }
        }

        // Pass 2: Edges
        actionList.forEach(a => {
            if (a.action === 'create_edge') {
                const fromId = idMap[a.from] || (nodeCache[a.from] ? a.from : null)
                const toId = idMap[a.to] || (nodeCache[a.to] ? a.to : null)

                if (fromId && toId) {
                    const edgeId = uuidv4()
                    batch.set(doc(db, 'boards', boardId, 'edges', edgeId), { id: edgeId, from: fromId, to: toId, page: activePage })
                }
            }
        })

        if (actionList.some(a => a.action === 'organize_board')) { window.dispatchEvent(new CustomEvent('ai-arrange')) }

        try {
            await batch.commit()
            if (createdIds.length > 0) setLastAIAction({ type: 'create', ids: createdIds })
        } catch (e) { console.error("Batch failed", e) }
    }

    const undoLastAIAction = async () => {
        if (lastAIAction?.type === 'create') {
            const batch = writeBatch(db)
            lastAIAction.ids.forEach(id => batch.delete(doc(db, 'boards', boardId, 'nodes', id)))
            const toDelete = lastAIAction.ids
            edges.filter(e => toDelete.includes(e.from) || toDelete.includes(e.to)).forEach(e => batch.delete(doc(db, 'boards', boardId, 'edges', e.id)))
            await batch.commit()
            setLastAIAction(null)
        }
    }

    const addNewPage = async () => {
        const existingNums = pages
            .map(p => {
                const match = p.match(/^Page (\d+)$/)
                return match ? parseInt(match[1], 10) : 0
            })
            .filter(n => !isNaN(n))

        const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0
        const newPageName = `Page ${maxNum + 1}`

        setPages(prev => [...prev, newPageName])
        setActivePage(newPageName)

        // Persist pages list to board doc immediately to avoid race conditions
        try {
            await updateDoc(doc(db, 'boards', boardId), {
                pages: arrayUnion(newPageName)
            })
        } catch (e) { console.error("Error saving page:", e) }
    }
    const displayNodes = nodes.filter(n => (n.page || 'Page 1') === activePage)
    const nodeIds = new Set(displayNodes.map(n => n.id))
    const displayEdges = edges.filter(e => (e.page || 'Page 1') === activePage && nodeIds.has(e.from) && nodeIds.has(e.to))

    const renamePage = async (oldName, newName) => {
        if (!newName.trim() || newName === oldName) return
        if (pages.includes(newName)) { alert('Page name already exists'); return }
        const batch = writeBatch(db)
        const pageNodes = nodes.filter(n => (n.page || 'Page 1') === oldName)
        pageNodes.forEach(n => batch.update(doc(db, 'boards', boardId, 'nodes', n.id), { page: newName }))
        edges.filter(e => (e.page || 'Page 1') === oldName).forEach(e => batch.update(doc(db, 'boards', boardId, 'edges', e.id), { page: newName }))
        await batch.commit()
        setPages(prev => prev.map(p => p === oldName ? newName : p))
        setActivePage(newName)
    }

    const deletePage = async (pageName) => {
        if (!pageName || pageName === 'Page 1') { alert('Cannot delete the main page!'); return }
        setConfirmModal({
            title: `Delete ${pageName}?`,
            message: `Are you sure you want to delete "${pageName}" and all its contents? This cannot be undone.`,
            onConfirm: async () => {
                const batch = writeBatch(db)
                // Delete nodes on page
                const pNodes = nodes.filter(n => (n.page || 'Page 1') === pageName)
                pNodes.forEach(n => batch.delete(doc(db, 'boards', boardId, 'nodes', n.id)))

                // Delete edges where both nodes are on page
                // (Edges crossing pages might be tricky, for now delete connected edges)
                const pNodeIds = pNodes.map(n => n.id)
                const pEdges = edges.filter(e => pNodeIds.includes(e.from) || pNodeIds.includes(e.to))
                pEdges.forEach(e => batch.delete(doc(db, 'boards', boardId, 'edges', e.id)))

                await batch.commit()

                const newPages = pages.filter(p => p !== pageName)
                setPages(newPages)
                if (activePage === pageName) setActivePage(newPages[0] || 'Page 1')
                await updateDoc(doc(db, 'boards', boardId), { pages: newPages })
                setConfirmModal(null)
            }
        })
    }

    const exportBoard = () => {
        const data = { title: boardTitle, nodes, edges, generated: new Date().toISOString() }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${boardTitle.replace(/\s+/g, '_')}_backup.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const [editingPage, setEditingPage] = useState(null)
    const [editName, setEditName] = useState('')
    const [tabMenu, setTabMenu] = useState(null) // { x, y, page }

    // Board Renaming
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [tempTitle, setTempTitle] = useState('')
    const saveTitle = async () => { setIsEditingTitle(false); if (tempTitle && tempTitle !== boardTitle) { try { await updateDoc(doc(db, 'boards', boardId), { title: tempTitle }) } catch (e) { console.error(e) } } }

    useEffect(() => {
        const h = () => setTabMenu(null)
        window.addEventListener('click', h)
        return () => window.removeEventListener('click', h)
    }, [])

    if (!hasAccess) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white', background: '#111' }}>Access Denied</div>

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            <ShareModal boardId={boardId} isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />

            {/* Top Bar - Mobile Optimized & Auto-Hide Pages */}
            <motion.div
                className="glass-panel"
                style={{
                    position: 'absolute', top: 20, left: 20, right: 20,
                    padding: isMobile ? '8px 15px' : '10px 20px',
                    zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderRadius: 50, pointerEvents: 'auto',
                    flexWrap: isMobile ? 'wrap' : 'nowrap',
                    gap: isMobile ? 10 : 0
                }}
                initial={{ y: -100 }} animate={{ y: 0 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 20 }}>
                    <button onClick={() => { updateThumbnail(); navigate('/dashboard') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}><FiHome /></button>
                    {isEditingTitle ? (
                        <input
                            value={tempTitle}
                            onChange={e => setTempTitle(e.target.value)}
                            onBlur={saveTitle}
                            onKeyDown={e => e.key === 'Enter' && saveTitle()}
                            autoFocus
                            style={{ fontSize: '1.2rem', fontWeight: 'bold', border: '1px solid #ccc', borderRadius: 4, padding: '2px 5px', outline: 'none', width: 250 }}
                        />
                    ) : (
                        <h1 onClick={() => { setTempTitle(boardTitle); setIsEditingTitle(true) }} style={{ fontSize: '1.2rem', margin: 0, cursor: 'pointer', border: '1px solid transparent', padding: '2px 5px' }} title="Click to rename">{boardTitle}</h1>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Presence Filter: 1 min timeout */}
                    <div style={{ display: 'flex', paddingRight: 10, borderRight: '1px solid #ddd' }}>
                        {collaborators.filter(c => !c.lastActive || (Date.now() - new Date(c.lastActive).getTime() < 60000)).map(c => (
                            <img key={c.uid} src={c.photoURL} title={c.displayName} style={{ width: 32, height: 32, borderRadius: '50%', border: cursors[c.uid] ? '2px solid #52c41a' : '2px solid white', marginLeft: -10 }} />
                        ))}
                    </div>

                    {isMobile ? (
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setTabMenu({ x: window.innerWidth - 140, y: 70, type: 'top-menu' })} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}><FiMenu /></button>
                            {tabMenu?.type === 'top-menu' && (
                                <div style={{ position: 'fixed', top: 60, right: 20, background: 'white', borderRadius: 12, boxShadow: '0 5px 20px rgba(0,0,0,0.15)', padding: 10, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <button onClick={() => { setIsShareOpen(true); setTabMenu(null) }} style={{ padding: '8px 12px', border: 'none', background: 'var(--primary)', color: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}><FiUserPlus /> Invite</button>
                                    <button onClick={() => { exportBoard(); setTabMenu(null) }} style={{ padding: '8px 12px', border: 'none', background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}><FiDownload /> Export</button>
                                    <button onClick={() => { setIsIncognito(!isIncognito); setTabMenu(null) }} style={{ padding: '8px 12px', border: 'none', background: 'transparent', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>{isIncognito ? <><FiEyeOff /> Show Me</> : <><FiEye /> Hide Me</>}</button>
                                    <button onClick={async () => { await signOut(auth); navigate('/login') }} style={{ padding: '8px 12px', border: 'none', background: '#fff1f0', color: 'red', borderRadius: 8, width: '100%' }}>Logout</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <button onClick={() => setIsIncognito(!isIncognito)} title={isIncognito ? "Show my cursor" : "Hide my cursor"} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: isIncognito ? '#999' : '#333' }}>{isIncognito ? <FiEyeOff /> : <FiEye />}</button>
                            <button onClick={exportBoard} style={{ background: 'rgba(255,255,255,0.2)', color: '#333', border: '1px solid #ddd', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 'bold' }}><FiDownload /> Export</button>
                            <button onClick={() => setIsShareOpen(true)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><FiUserPlus /> Invite</button>
                            <button onClick={async () => { await signOut(auth); navigate('/login') }} style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 20, cursor: 'pointer' }}>Logout</button>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Persistent AI Review Banner */}
            {nodes.some(n => n.aiStatus === 'suggested') && (
                <div style={{ position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: '#222', color: 'white', padding: '12px 24px', borderRadius: 50, display: 'flex', gap: 15, alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                    <span style={{ fontWeight: 'bold' }}>AI Suggestions Pending Review</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={() => batchUpdateNodes(nodes.filter(n => n.aiStatus === 'suggested').map(n => ({ id: n.id, data: { aiStatus: 'accepted' } })))}
                            style={{ background: '#52c41a', border: 'none', color: 'white', padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Accept All
                        </button>
                        <button
                            onClick={() => handleBatchDelete(nodes.filter(n => n.aiStatus === 'suggested').map(n => n.id))}
                            style={{ background: '#ff4d4f', border: 'none', color: 'white', padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Discard All
                        </button>
                    </div>
                </div>
            )}

            <div
                style={{
                    position: 'absolute', bottom: 20, left: 20, zIndex: 150,
                    display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
                    maxWidth: isMobile ? '80vw' : '300px',
                    opacity: isMobile ? 1 : 0.3,
                    transition: 'opacity 0.3s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => !isMobile && (e.currentTarget.style.opacity = 0.3)}
            >
                <div style={{ display: 'flex', gap: 5, background: 'rgba(0,0,0,0.8)', padding: '8px 12px', borderRadius: 16, pointerEvents: 'auto', overflowX: 'auto', scrollbarWidth: 'none', whiteSpace: 'nowrap' }}>
                    {pages.map(p => (
                        editingPage === p ? (
                            <input
                                key={p}
                                autoFocus
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onBlur={() => { renamePage(p, editName); setEditingPage(null) }}
                                onKeyDown={e => { if (e.key === 'Enter') { renamePage(p, editName); setEditingPage(null) } }}
                                style={{ width: 80, padding: '8px', borderRadius: 10, border: 'none' }}
                            />
                        ) : (
                            <button
                                key={p}
                                onClick={() => setActivePage(p)}
                                onDoubleClick={() => { setEditingPage(p); setEditName(p) }}
                                onContextMenu={(e) => { e.preventDefault(); setTabMenu({ x: e.clientX, y: e.clientY, page: p }) }}
                                style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: activePage === p ? 'var(--primary)' : 'rgba(255,255,255,0.2)', color: 'white', fontWeight: activePage === p ? 'bold' : 'normal', cursor: 'pointer' }}
                            >
                                {p}
                            </button>
                        )
                    ))}
                    <button onClick={addNewPage} style={{ padding: '8px 12px', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.5)', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>+ New Page</button>
                </div>
            </div>

            {/* Tab Context Menu */}
            {tabMenu && (
                <div style={{ position: 'fixed', top: tabMenu.y - 100, left: tabMenu.x, background: 'white', borderRadius: 8, boxShadow: '0 5px 15px rgba(0,0,0,0.2)', zIndex: 1000, overflow: 'hidden', minWidth: 120 }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontWeight: 'bold', fontSize: '0.9rem' }}>{tabMenu.page}</div>
                    <button onClick={() => { setEditingPage(tabMenu.page); setEditName(tabMenu.page); setTabMenu(null) }} style={{ display: 'block', width: '100%', padding: '8px 12px', border: 'none', background: 'white', textAlign: 'left', cursor: 'pointer' }} onMouseEnter={e => e.target.style.background = '#f5f5f5'} onMouseLeave={e => e.target.style.background = 'white'}>Rename</button>
                    <button onClick={() => { deletePage(tabMenu.page); setTabMenu(null) }} style={{ display: 'block', width: '100%', padding: '8px 12px', border: 'none', background: 'white', textAlign: 'left', cursor: 'pointer', color: 'red' }} onMouseEnter={e => e.target.style.background = '#fff1f0'} onMouseLeave={e => e.target.style.background = 'white'}>Delete</button>
                </div>
            )}

            <div style={{ width: '100%', height: '100%' }}>
                <Whiteboard
                    nodes={nodes.filter(n => (n.page || 'Page 1') === activePage)}
                    edges={edges.filter(e => (e.page || 'Page 1') === activePage)}
                    pages={pages}
                    canvasSize={pageConfigs[activePage] || { w: 3000, h: 2000 }}
                    onUpdateCanvasSize={updateCanvasSize}
                    onAddNode={addNode}
                    onUpdateNodePosition={updateNodePosition}
                    onUpdateNodeData={updateNodeData}
                    onDeleteNode={deleteNode}
                    onBatchDelete={handleBatchDelete}
                    onBatchUpdate={batchUpdateNodes}
                    onCopy={copyNodes}
                    onPaste={pasteNodes}
                    onMoveToPage={batchMoveToPage}
                    onAddEdge={addEdge}
                    onDeleteEdge={async (id) => { await deleteDoc(doc(db, 'boards', boardId, 'edges', id)) }}
                    cursors={Object.values(cursors).filter(c => c.page === activePage)}
                    onCursorMove={handleCursorMove}
                    onAIRequest={handleAIRequest}
                    onSelectionChange={() => { }}
                />
            </div>
            <ChatInterface boardId={boardId} user={user} onAction={handleAIAction} nodes={nodes} collaborators={collaborators} />
            {/* Confirm Modal */}
            {confirmModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'white', padding: 30, borderRadius: 24,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '90%', maxWidth: 400,
                            border: '1px solid rgba(0,0,0,0.05)'
                        }}
                    >
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>{confirmModal.title}</h2>
                        <p style={{ color: '#666', marginBottom: 25, lineHeight: 1.5 }}>{confirmModal.message}</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button onClick={() => setConfirmModal(null)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#f1f2f6', color: '#666', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                            <button onClick={confirmModal.onConfirm} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#ff4757', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
