import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import Whiteboard from './Whiteboard'
import ChatInterface from './ChatInterface'
import ShareModal from './ShareModal'
import { db } from '../firebase'
import { collection, onSnapshot, setDoc, doc, updateDoc, deleteDoc, arrayUnion, writeBatch } from 'firebase/firestore'
import { FiHome, FiUserPlus } from 'react-icons/fi'

export default function BoardPage({ user }) {
    const { boardId } = useParams()
    const navigate = useNavigate()
    const [nodes, setNodes] = useState([])
    const [boardTitle, setBoardTitle] = useState('Loading...')
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [collaborators, setCollaborators] = useState([])
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [hasAccess, setHasAccess] = useState(true)
    const [activePage, setActivePage] = useState('Page 1')
    const [pages, setPages] = useState(['Page 1'])
    const [lastAIAction, setLastAIAction] = useState(null)
    const [clipboard, setClipboard] = useState(null) // { nodes: [] }

    // --- Data Sync ---
    useEffect(() => {
        if (!boardId || !user) return
        const unsub = onSnapshot(doc(db, 'boards', boardId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()
                setBoardTitle(data.title); const isOwner = data.createdBy === user.uid; const isAllowed = data.allowedEmails?.includes(user.email) || isOwner;
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
        if (!user || !boardId || !hasAccess) return
        setDoc(doc(db, 'boards', boardId, 'presence', user.uid), { uid: user.uid, photoURL: user.photoURL, displayName: user.displayName, lastActive: new Date().toISOString() })
        const unsub = onSnapshot(collection(db, 'boards', boardId, 'presence'), (snap) => { setCollaborators(snap.docs.map(d => d.data())) })
        return () => { unsub() }
    }, [user, boardId, hasAccess])

    // --- Core Operations ---
    const addNode = async (type, content, extraData = {}) => {
        if (!user || !hasAccess) return null
        const newNode = { id: uuidv4(), type: type || 'Note', page: activePage, x: extraData.x || (window.innerWidth / 2 - 140 + (Math.random() * 40 - 20)), y: extraData.y || (window.innerHeight / 2 - 100 + (Math.random() * 40 - 20)), content: content || '', items: [], events: extraData.events || {}, src: '', videoId: '', createdAt: new Date().toISOString(), createdBy: user.uid, ...extraData }
        try { await setDoc(doc(db, 'boards', boardId, 'nodes', newNode.id), newNode); return newNode.id } catch (e) { console.error("Error adding node:", e); return null }
    }

    const updateNodePosition = async (id, offset) => { const node = nodes.find(n => n.id === id); if (!node) return; try { await updateDoc(doc(db, 'boards', boardId, 'nodes', id), { x: node.x + offset.x, y: node.y + offset.y }) } catch (e) { console.error(e) } }
    const updateNodeData = async (id, data) => { try { await updateDoc(doc(db, 'boards', boardId, 'nodes', id), data) } catch (e) { console.error(e) } }
    const deleteNode = async (id) => { try { await deleteDoc(doc(db, 'boards', boardId, 'nodes', id)) } catch (e) { console.error(e) } }

    // --- Batch Operations (Exposed to Whiteboard) ---
    const batchDelete = async (ids) => {
        if (!ids.length || !window.confirm(`Delete ${ids.length} items?`)) return
        const batch = writeBatch(db); ids.forEach(id => batch.delete(doc(db, 'boards', boardId, 'nodes', id))); await batch.commit()
    }

    const batchMoveToPage = async (ids, targetPage) => {
        const batch = writeBatch(db); ids.forEach(id => batch.update(doc(db, 'boards', boardId, 'nodes', id), { page: targetPage })); await batch.commit()
        setActivePage(targetPage) // Optional: switch to that page
    }

    const copyNodes = (ids) => {
        const toCopy = nodes.filter(n => ids.includes(n.id))
        setClipboard(toCopy)
        alert(`Copied ${toCopy.length} items`)
    }

    const pasteNodes = async (atX, atY) => {
        if (!clipboard || clipboard.length === 0) return
        const batch = writeBatch(db)
        // Calculate center of copied group to preserve relative layout
        const minX = Math.min(...clipboard.map(n => n.x)); const minY = Math.min(...clipboard.map(n => n.y))

        clipboard.forEach(node => {
            const newId = uuidv4()
            const offsetX = node.x - minX; const offsetY = node.y - minY
            // If atX provided, paste there. Else paste with small offset from original
            const finalX = atX !== undefined ? atX + offsetX : node.x + 50
            const finalY = atY !== undefined ? atY + offsetY : node.y + 50

            const newNode = { ...node, id: newId, page: activePage, x: finalX, y: finalY, createdAt: new Date().toISOString(), createdBy: user.uid }
            batch.set(doc(db, 'boards', boardId, 'nodes', newId), newNode)
        })
        await batch.commit()
    }

    // --- AI Logic ---
    const handleAIAction = async (actions) => {
        const actionList = Array.isArray(actions) ? actions : [actions]
        const createdIds = []; const cols = Math.ceil(Math.sqrt(actionList.length));
        const startX = window.innerWidth / 2 - ((cols * 320) / 2); const startY = window.innerHeight / 2 - 200

        for (let i = 0; i < actionList.length; i++) {
            const action = actionList[i]
            if (action.action === 'create_node' || action.action === 'create_calendar_plan') {
                const type = action.nodeType || (action.action === 'create_calendar_plan' ? 'Calendar' : 'Note')
                const content = action.content || ''; const extra = action.data || (action.action === 'create_calendar_plan' ? { events: action.events } : {})
                const posX = startX + (i % cols) * 340; const posY = startY + Math.floor(i / cols) * 340
                const id = await addNode(type, content, { ...extra, x: posX, y: posY })
                if (id) createdIds.push(id)
            }
            if (action.action === 'organize_board') { window.dispatchEvent(new CustomEvent('ai-arrange')) }
        }
        if (createdIds.length > 0) setLastAIAction({ type: 'create', ids: createdIds })
    }
    const undoLastAIAction = async () => { if (lastAIAction?.type === 'create') { const batch = writeBatch(db); lastAIAction.ids.forEach(id => batch.delete(doc(db, 'boards', boardId, 'nodes', id))); await batch.commit(); setLastAIAction(null) } }

    // --- Page Logic ---
    const addNewPage = () => { const p = `Page ${pages.length + 1}`; setPages([...pages, p]); setActivePage(p) }
    const displayNodes = nodes.filter(n => (n.page || 'Page 1') === activePage)

    if (!hasAccess) return <div>Access Denied</div>

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            <ShareModal boardId={boardId} isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
            {/* Navbar */}
            <motion.div className="glass-panel" style={{ position: 'absolute', top: 20, left: 20, right: 20, padding: '10px 20px', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 50, pointerEvents: 'auto' }} initial={{ y: -100 }} animate={{ y: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}><button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}><FiHome /></button><h1 style={{ fontSize: '1.2rem', margin: 0 }}>{boardTitle}</h1></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', paddingRight: 10, borderRight: '1px solid #ddd' }}>{collaborators.map(c => (<img key={c.uid} src={c.photoURL} title={c.displayName} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid white', marginLeft: -10 }} />))}</div>
                    <button onClick={() => setIsShareOpen(true)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><FiUserPlus /> Invite</button>
                </div>
            </motion.div>

            {/* Undo Toast */}
            {lastAIAction && (<div style={{ position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: '#333', color: 'white', padding: '10px 20px', borderRadius: 20, display: 'flex', gap: 10, alignItems: 'center' }}><span>AI completed an action. Satisfied?</span><button onClick={() => setLastAIAction(null)} style={{ background: 'green', border: 'none', color: 'white', padding: '5px 10px', borderRadius: 10, cursor: 'pointer' }}>Yes</button><button onClick={undoLastAIAction} style={{ background: 'red', border: 'none', color: 'white', padding: '5px 10px', borderRadius: 10, cursor: 'pointer' }}>No (Undo)</button></div>)}

            {/* Page Tabs */}
            <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 150, display: 'flex', gap: 5, background: 'rgba(0,0,0,0.8)', padding: '8px 12px', borderRadius: 16 }}>{pages.map(p => (<button key={p} onClick={() => setActivePage(p)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: activePage === p ? 'var(--primary)' : 'rgba(255,255,255,0.2)', color: 'white', fontWeight: activePage === p ? 'bold' : 'normal', cursor: 'pointer' }}>{p}</button>))}<button onClick={addNewPage} style={{ padding: '8px 12px', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.5)', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>+ New Page</button></div>

            {/* Whiteboard with batch props */}
            <div style={{ width: '100%', height: '100%' }}>
                <Whiteboard
                    nodes={displayNodes}
                    pages={pages}
                    onAddNode={addNode}
                    onUpdateNodePosition={updateNodePosition}
                    onUpdateNodeData={updateNodeData}
                    onDeleteNode={deleteNode}
                    // Batch Props
                    onBatchDelete={batchDelete}
                    onCopy={copyNodes}
                    onPaste={pasteNodes}
                    onMoveToPage={batchMoveToPage}
                />
            </div>

            {/* Chat with Context */}
            <ChatInterface onAction={handleAIAction} nodes={nodes} collaborators={collaborators} />
        </div>
    )
}
