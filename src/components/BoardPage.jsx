import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import Whiteboard from './Whiteboard'
import ChatInterface from './ChatInterface'
import ShareModal from './ShareModal'
import { db } from '../firebase'
import { collection, onSnapshot, setDoc, doc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore'
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

    useEffect(() => {
        if (!boardId || !user) return
        const unsub = onSnapshot(doc(db, 'boards', boardId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()
                setBoardTitle(data.title)
                const isOwner = data.createdBy === user.uid
                const isAllowed = data.allowedEmails?.includes(user.email) || isOwner
                if (data.allowedEmails && !isAllowed) { setHasAccess(false) } else { setHasAccess(true) }
            } else { setBoardTitle('Board Not Found') }
        }, (error) => { console.error("Board Metadata Error:", error); if (error.code === 'permission-denied') setHasAccess(false) })
        return unsub
    }, [boardId, user])

    useEffect(() => {
        if (!boardId || !hasAccess) return
        const unsub = onSnapshot(collection(db, 'boards', boardId, 'nodes'), (snapshot) => {
            const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            setNodes(loaded)
            const nodePages = new Set(loaded.map(n => n.page).filter(p => p))
            if (nodePages.size > 0) { setPages(prev => Array.from(new Set([...prev, ...nodePages])).sort()) }
        })
        return unsub
    }, [boardId, hasAccess])

    useEffect(() => {
        if (!user || !boardId || !hasAccess) return
        setDoc(doc(db, 'boards', boardId, 'presence', user.uid), { uid: user.uid, photoURL: user.photoURL, displayName: user.displayName, lastActive: new Date().toISOString() })
        const unsub = onSnapshot(collection(db, 'boards', boardId, 'presence'), (snap) => { setCollaborators(snap.docs.map(d => d.data())) })
        return () => { unsub() }
    }, [user, boardId, hasAccess])

    const addNode = async (type, content, extraData = {}) => {
        if (!user || !hasAccess) return null
        const newNode = { id: uuidv4(), type: type || 'Note', page: activePage, x: extraData.x || (window.innerWidth / 2 - 140 + (Math.random() * 40 - 20)), y: extraData.y || (window.innerHeight / 2 - 100 + (Math.random() * 40 - 20)), content: content || '', items: [], events: extraData.events || {}, src: '', videoId: '', createdAt: new Date().toISOString(), createdBy: user.uid, ...extraData }
        try { await setDoc(doc(db, 'boards', boardId, 'nodes', newNode.id), newNode); return newNode.id } catch (e) { console.error("Error adding node:", e); return null }
    }

    const updateNodePosition = async (id, offset) => { const node = nodes.find(n => n.id === id); if (!node) return; try { await updateDoc(doc(db, 'boards', boardId, 'nodes', id), { x: node.x + offset.x, y: node.y + offset.y }) } catch (e) { console.error(e) } }
    const updateNodeData = async (id, data) => { try { await updateDoc(doc(db, 'boards', boardId, 'nodes', id), data) } catch (e) { console.error("Error updating node data:", e) } }
    const deleteNode = async (id) => { if (!window.confirm("Delete this item?")) return; try { await deleteDoc(doc(db, 'boards', boardId, 'nodes', id)) } catch (e) { console.error("Error deleting node:", e) } }

    const handleAIAction = async (actions) => {
        const actionList = Array.isArray(actions) ? actions : [actions]
        const createdIds = []
        const cols = Math.ceil(Math.sqrt(actionList.length))
        const startX = window.innerWidth / 2 - ((cols * 320) / 2)
        const startY = window.innerHeight / 2 - 200
        for (let i = 0; i < actionList.length; i++) {
            const action = actionList[i]
            const col = i % cols
            const row = Math.floor(i / cols)
            const posX = startX + col * 340
            const posY = startY + row * 340
            if (action.action === 'create_node' || action.action === 'create_calendar_plan') {
                const type = action.nodeType || (action.action === 'create_calendar_plan' ? 'Calendar' : 'Note')
                const content = action.content || ''
                const extraData = action.data || (action.action === 'create_calendar_plan' ? { events: action.events } : {})
                const id = await addNode(type, content, { ...extraData, x: posX, y: posY })
                if (id) createdIds.push(id)
            }
            if (action.action === 'organize_board') { window.dispatchEvent(new CustomEvent('ai-arrange')) }
        }
        if (createdIds.length > 0) { setLastAIAction({ type: 'create', ids: createdIds }) }
    }

    const undoLastAIAction = async () => { if (!lastAIAction) return; if (lastAIAction.type === 'create') { for (const id of lastAIAction.ids) { await deleteDoc(doc(db, 'boards', boardId, 'nodes', id)) }; alert("AI Action Undone."); setLastAIAction(null) } }
    const addNewPage = () => { const newPage = `Page ${pages.length + 1}`; setPages([...pages, newPage]); setActivePage(newPage) }
    const displayNodes = nodes.filter(n => (n.page || 'Page 1') === activePage)

    if (!hasAccess) { return (<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}><h1>Access Denied</h1><p>You do not have permission to view this whiteboard.</p><button onClick={() => navigate('/')} style={{ padding: '10px 20px', cursor: 'pointer' }}>Back to Dashboard</button></div>) }

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            <ShareModal boardId={boardId} isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
            <motion.div className="glass-panel" style={{ position: 'absolute', top: 20, left: 20, right: 20, padding: '10px 20px', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 50, pointerEvents: 'auto' }} initial={{ y: -100 }} animate={{ y: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Back to Dashboard"><FiHome /></button>
                    {isEditingTitle ? (
                        <input autoFocus value={boardTitle} onChange={(e) => setBoardTitle(e.target.value)} onBlur={async () => { setIsEditingTitle(false); await updateDoc(doc(db, 'boards', boardId), { title: boardTitle }) }} onKeyDown={async (e) => { if (e.key === 'Enter') { setIsEditingTitle(false); await updateDoc(doc(db, 'boards', boardId), { title: boardTitle }) } }} style={{ fontSize: '1.2rem', fontWeight: 700, border: '1px solid #ddd', borderRadius: 4, padding: '2px 5px', outline: 'none' }} />
                    ) : (
                        <h1 onClick={() => setIsEditingTitle(true)} style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, cursor: 'pointer', border: '1px solid transparent', padding: '2px 5px' }} title="Click to rename" onMouseEnter={(e) => e.target.style.border = '1px dashed #ccc'} onMouseLeave={(e) => e.target.style.border = '1px solid transparent'}>{boardTitle}</h1>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', paddingRight: 10, borderRight: '1px solid #ddd' }}>{collaborators.map(c => (<img key={c.uid} src={c.photoURL} title={c.displayName} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid white', marginLeft: -10 }} />))}</div>
                    <button onClick={() => setIsShareOpen(true)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><FiUserPlus /> Invite</button>
                </div>
            </motion.div>
            {lastAIAction && (<div style={{ position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: '#333', color: 'white', padding: '10px 20px', borderRadius: 20, display: 'flex', gap: 10, alignItems: 'center' }}><span>AI completed an action. Satisfied?</span><button onClick={() => setLastAIAction(null)} style={{ background: 'green', border: 'none', color: 'white', padding: '5px 10px', borderRadius: 10, cursor: 'pointer' }}>Yes</button><button onClick={undoLastAIAction} style={{ background: 'red', border: 'none', color: 'white', padding: '5px 10px', borderRadius: 10, cursor: 'pointer' }}>No (Undo)</button></div>)}
            <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 110, display: 'flex', gap: 5 }}>{pages.map(p => (<button key={p} onClick={() => setActivePage(p)} style={{ padding: '8px 16px', borderRadius: '12px 12px 0 0', border: 'none', background: activePage === p ? 'white' : 'rgba(255,255,255,0.5)', fontWeight: activePage === p ? 'bold' : 'normal', cursor: 'pointer', boxShadow: '0 -2px 5px rgba(0,0,0,0.05)' }}>{p}</button>))}<button onClick={addNewPage} style={{ padding: '8px 12px', borderRadius: '12px 12px 0 0', border: 'none', background: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>+</button></div>
            <div style={{ width: '100%', height: '100%' }}><Whiteboard nodes={displayNodes} onAddNode={addNode} onUpdateNodePosition={updateNodePosition} onUpdateNodeData={updateNodeData} onDeleteNode={deleteNode} /></div>
            <ChatInterface onAction={handleAIAction} />
        </div>
    )
}
