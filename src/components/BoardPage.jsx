import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import Whiteboard from './Whiteboard'
import ChatInterface from './ChatInterface'
import ShareModal from './ShareModal'
import { db, auth } from '../firebase'
import { collection, onSnapshot, setDoc, doc, updateDoc, deleteDoc, arrayUnion, writeBatch } from 'firebase/firestore'
import { FiHome, FiUserPlus, FiDownload, FiEye, FiEyeOff } from 'react-icons/fi'
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
    const throttleRef = useRef(Date.now())
    const isMobile = useMediaQuery('(max-width: 768px)')

    // --- Thumbnail Generator ---
    const updateThumbnail = async () => {
        if (!nodes.length || !hasAccess) return

        // Simple SVG serializer
        const pageNodes = nodes.filter(n => (n.page || 'Page 1') === 'Page 1') // Only thumbnail page 1
        if (pageNodes.length === 0) return

        // Calculate bounding box
        const nodesX = pageNodes.map(n => n.x)
        const nodesY = pageNodes.map(n => n.y)
        const nodesR = pageNodes.map(n => n.x + (n.w || 320))
        const nodesB = pageNodes.map(n => n.y + (n.h || 240))

        const minX = Math.min(...nodesX) - 50 // Add padding
        const minY = Math.min(...nodesY) - 50
        const maxX = Math.max(...nodesR) + 50
        const maxY = Math.max(...nodesB) + 50

        const w = Math.max(maxX - minX, 100)
        const h = Math.max(maxY - minY, 100)

        // Create simplified SVG string
        let svgContent = ''
        pageNodes.forEach(n => {
            const nx = n.x - minX; const ny = n.y - minY
            let color = '#f0f0f0'; let stroke = '#ccc'
            if (n.type === 'Note') { color = '#ffd'; stroke = '#eeb' }
            else if (n.type === 'Todo') { color = '#e6f7ff'; stroke = '#91d5ff' }
            else if (n.type === 'Image') { color = '#eee'; stroke = '#ddd' }

            svgContent += `<rect x="${nx}" y="${ny}" width="${n.w || 320}" height="${n.h || 240}" fill="${color}" stroke="${stroke}" rx="8" />`
            if (n.content) {
                // Very basic text truncation
                const text = n.content.substring(0, 20).replace(/</g, '&lt;')
                svgContent += `<text x="${nx + 10}" y="${ny + 20}" font-family="sans-serif" font-size="12" fill="#555">${text}</text>`
            }
        })

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 ${w} ${h}" style="background:white">${svgContent}</svg>`
        const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`

        await updateDoc(doc(db, 'boards', boardId), { thumbnail: dataUrl })
    }

    // Auto-save thumbnail every 30s if changes happened (simple debounced version)
    useEffect(() => {
        const i = setInterval(updateThumbnail, 30000)
        return () => clearInterval(i)
    }, [nodes])


    // --- Data Sync ---
    useEffect(() => {
        if (!boardId || !user) return
        const unsub = onSnapshot(doc(db, 'boards', boardId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()
                setBoardTitle(data.title); const isOwner = data.createdBy === user.uid;
                const isAllowed = data.allowedEmails?.some(e => e.toLowerCase() === (user.email || '').toLowerCase()) || isOwner;
                if (data.allowedEmails && !isAllowed) { setHasAccess(false) } else { setHasAccess(true) }
            } else { setBoardTitle('Board Not Found') }
        }, (error) => { if (error.code === 'permission-denied') setHasAccess(false) })
        return unsub
    }, [boardId, user])

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
        if (isIncognito || !user || Date.now() - throttleRef.current < 50) return
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
            alert("AI Error: " + e.message)
        }
    }

    const addNode = async (type, content, extraData = {}) => {
        if (!user || !hasAccess) return null
        const newNode = { id: uuidv4(), type: type || 'Note', page: activePage, x: extraData.x || (window.innerWidth / 2), y: extraData.y || (window.innerHeight / 2), content: content || '', items: [], events: extraData.events || {}, src: '', videoId: '', createdAt: new Date().toISOString(), createdBy: user.uid, ...extraData }
        try { await setDoc(doc(db, 'boards', boardId, 'nodes', newNode.id), newNode); return newNode.id } catch (e) { console.error("Error adding node:", e); return null }
    }

    const addEdge = async (fromId, toId) => {
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
    const batchDelete = async (ids) => {
        if (!ids.length || !window.confirm(`Delete ${ids.length} items?`)) return
        const batch = writeBatch(db)
        ids.forEach(id => batch.delete(doc(db, 'boards', boardId, 'nodes', id)))
        edges.filter(e => ids.includes(e.from) || ids.includes(e.to)).forEach(e => batch.delete(doc(db, 'boards', boardId, 'edges', e.id)))
        await batch.commit()
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

        // Pass 1: Creation & Deletion
        const batch = writeBatch(db)
        const idMap = {} // Local ID -> Real Firestore ID

        // Helper: Extract YouTube ID
        const getYTId = (u) => { const m = u?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/); return (m && m[2].length === 11) ? m[2] : null }

        for (const a of actionList) {
            // --- CREATION ---
            if (['create_node', 'create_calendar_plan', 'create_video', 'create_link'].includes(a.action)) {
                const newId = uuidv4()
                if (a.id) idMap[a.id] = newId

                let type = a.nodeType || 'Note'
                let content = a.content || ''
                let extra = a.data || {}

                // Unified Type Handling
                if (a.action === 'create_calendar_plan') { type = 'Calendar'; extra = { events: a.events || {} } }
                else if (a.action === 'create_video') { type = 'YouTube' }
                else if (a.action === 'create_link') { type = 'Link' }

                // Smart Property Extraction
                if (type === 'YouTube') {
                    const u = a.url || (content.startsWith('http') ? content : '')
                    const vid = a.videoId || getYTId(u)
                    if (vid) { extra.videoId = vid; if (!content) content = u }
                }
                else if (type === 'Link') {
                    const u = a.url || (content.startsWith('http') ? content : '')
                    if (u) { extra.url = u; content = u } // Force content to be URL for Links
                }
                else if (type === 'Calendar') {
                    // Try to extract events from data, or parse content if needed (simple fallback)
                    if (!extra.events && a.events) extra.events = a.events
                }

                // Positioning
                const startX = Math.max(100, (pageNodes.length > 0 ? Math.max(...pageNodes.map(n => n.x)) + 350 : 100))
                const x = a.x !== undefined ? a.x : startX + (createdIds.length * 360) % 1000
                const y = a.y !== undefined ? a.y : 150 + Math.floor((createdIds.length * 360) / 1000) * 300

                batch.set(doc(db, 'boards', boardId, 'nodes', newId), {
                    id: newId, type, content, page: activePage, x, y, items: [], events: {}, src: '', videoId: '', ...extra,
                    createdAt: new Date().toISOString(), createdBy: user.uid
                })
                createdIds.push(newId)
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
                })
            }
        }

        // Pass 2: Edges (Connections)
        actionList.forEach(a => {
            if (a.action === 'create_edge') {
                // Resolves local ID (from this batch) OR valid existing ID
                const fromId = idMap[a.from] || (nodes.find(n => n.id === a.from) ? a.from : null)
                const toId = idMap[a.to] || (nodes.find(n => n.id === a.to) ? a.to : null)

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

    const addNewPage = () => { const p = `Page ${pages.length + 1}`; setPages([...pages, p]); setActivePage(p) }
    const displayNodes = nodes.filter(n => (n.page || 'Page 1') === activePage)
    const displayEdges = edges.filter(e => (e.page || 'Page 1') === activePage)

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
        if (!window.confirm(`Are you sure you want to delete "${pageName}" and all its contents? This cannot be undone.`)) return

        const batch = writeBatch(db)
        const pageNodes = nodes.filter(n => (n.page || 'Page 1') === pageName)
        pageNodes.forEach(n => batch.delete(doc(db, 'boards', boardId, 'nodes', n.id)))
        edges.filter(e => (e.page || 'Page 1') === pageName).forEach(e => batch.delete(doc(db, 'boards', boardId, 'edges', e.id)))

        await batch.commit()
        setPages(prev => prev.filter(p => p !== pageName))
        if (activePage === pageName) setActivePage('Page 1')
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
                    <div style={{ display: 'flex', paddingRight: 10, borderRight: '1px solid #ddd' }}>{collaborators.map(c => (<img key={c.uid} src={c.photoURL} title={c.displayName} style={{ width: 32, height: 32, borderRadius: '50%', border: cursors[c.uid] ? '2px solid #52c41a' : '2px solid white', marginLeft: -10 }} />))}</div>
                    <button onClick={() => setIsIncognito(!isIncognito)} title={isIncognito ? "Show my cursor" : "Hide my cursor"} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: isIncognito ? '#999' : '#333' }}>{isIncognito ? <FiEyeOff /> : <FiEye />}</button>
                    <button onClick={exportBoard} style={{ background: 'rgba(255,255,255,0.2)', color: '#333', border: '1px solid #ddd', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 'bold' }}><FiDownload /> Export</button>
                    <button onClick={() => setIsShareOpen(true)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><FiUserPlus /> Invite</button>
                    <button onClick={async () => { await signOut(auth); navigate('/login') }} style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 20, cursor: 'pointer' }}>Logout</button>
                </div>
            </motion.div>

            {lastAIAction && (<div style={{ position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: '#333', color: 'white', padding: '10px 20px', borderRadius: 20, display: 'flex', gap: 10, alignItems: 'center' }}><span>AI completed an action. Satisfied?</span><button onClick={() => setLastAIAction(null)} style={{ background: 'green', border: 'none', color: 'white', padding: '5px 10px', borderRadius: 10, cursor: 'pointer' }}>Yes</button><button onClick={undoLastAIAction} style={{ background: 'red', border: 'none', color: 'white', padding: '5px 10px', borderRadius: 10, cursor: 'pointer' }}>No (Undo)</button></div>)}

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
                    cursors={Object.fromEntries(Object.entries(cursors).filter(([_, c]) => (c.page || 'Page 1') === activePage))}
                    onCursorMove={handleCursorMove}
                    nodes={displayNodes}
                    edges={displayEdges}
                    pages={pages}
                    onAddNode={addNode}
                    onUpdateNodePosition={updateNodePosition}
                    onUpdateNodeData={updateNodeData}
                    onDeleteNode={deleteNode}
                    onBatchDelete={batchDelete}
                    onBatchUpdate={batchUpdateNodes}
                    onCopy={copyNodes}
                    onPaste={pasteNodes}
                    onMoveToPage={batchMoveToPage}
                    onAIRequest={handleAIRequest}
                    onAddEdge={addEdge}
                    onDeleteEdge={(id) => { const batch = writeBatch(db); batch.delete(doc(db, 'boards', boardId, 'edges', id)); batch.commit() }}
                />
            </div>
            <ChatInterface boardId={boardId} user={user} onAction={handleAIAction} nodes={nodes} collaborators={collaborators} />
        </div >
    )
}
