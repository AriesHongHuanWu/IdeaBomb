import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import Whiteboard from './Whiteboard'
import ChatInterface from './ChatInterface'
import ShareModal from './ShareModal'
import { db } from '../firebase'
import { collection, onSnapshot, setDoc, doc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore'
import { FiHome, FiShare2, FiUserPlus } from 'react-icons/fi'

export default function BoardPage({ user }) {
    const { boardId } = useParams()
    const navigate = useNavigate()
    const [nodes, setNodes] = useState([])
    const [boardTitle, setBoardTitle] = useState('Loading...')
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [collaborators, setCollaborators] = useState([])
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [hasAccess, setHasAccess] = useState(true)

    // 1. Sync Board Metadata (Title) & Check Access
    useEffect(() => {
        if (!boardId || !user) return
        const unsub = onSnapshot(doc(db, 'boards', boardId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()
                setBoardTitle(data.title)

                // Access Check: Owner OR in allowedEmails
                const isOwner = data.createdBy === user.uid
                const isAllowed = data.allowedEmails?.includes(user.email) || isOwner

                if (data.allowedEmails && !isAllowed) {
                    setHasAccess(false)
                } else {
                    setHasAccess(true)
                }
            } else {
                setBoardTitle('Board Not Found')
            }
        }, (error) => {
            console.error("Board Metadata Error:", error)
            if (error.code === 'permission-denied') setHasAccess(false)
        })
        return unsub
    }, [boardId, user])

    // 2. Sync Nodes (Sub-collection)
    useEffect(() => {
        if (!boardId || !hasAccess) return
        const q = collection(db, 'boards', boardId, 'nodes')
        const unsub = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            setNodes(loaded)
        })
        return unsub
    }, [boardId, hasAccess])

    // 3. Presence System
    useEffect(() => {
        if (!user || !boardId || !hasAccess) return
        const presenceRef = doc(db, 'boards', boardId, 'presence', user.uid)
        setDoc(presenceRef, {
            uid: user.uid,
            photoURL: user.photoURL,
            displayName: user.displayName,
            lastActive: new Date().toISOString()
        })

        const unsub = onSnapshot(collection(db, 'boards', boardId, 'presence'), (snap) => {
            setCollaborators(snap.docs.map(d => d.data()))
        })
        return () => { unsub() }
    }, [user, boardId, hasAccess])

    // --- Logic Functions ---

    const addNode = async (type, content) => {
        if (!user || !hasAccess) return
        const newNode = {
            id: uuidv4(),
            type: type || 'Note',
            x: window.innerWidth / 2 - 140 + (Math.random() * 40 - 20),
            y: window.innerHeight / 2 - 100 + (Math.random() * 40 - 20),
            content: content || (type === 'Todo' ? '- [ ] New Task' : 'New Item'),
            items: [], // For Todo
            events: {}, // For Calendar
            src: '', // For Image
            videoId: '', // For YouTube
            createdAt: new Date().toISOString(),
            createdBy: user.uid
        }
        try {
            await setDoc(doc(db, 'boards', boardId, 'nodes', newNode.id), newNode)
        } catch (e) {
            console.error("Error adding node:", e)
        }
    }

    const updateNodePosition = async (id, offset) => {
        const node = nodes.find(n => n.id === id)
        if (!node) return
        try {
            await updateDoc(doc(db, 'boards', boardId, 'nodes', id), {
                x: node.x + offset.x,
                y: node.y + offset.y
            })
        } catch (e) { console.error(e) }
    }

    const updateNodeData = async (id, data) => {
        try {
            await updateDoc(doc(db, 'boards', boardId, 'nodes', id), data)
        } catch (e) {
            console.error("Error updating node data:", e)
        }
    }

    const deleteNode = async (id) => {
        if (!window.confirm("Delete this item?")) return
        try {
            await deleteDoc(doc(db, 'boards', boardId, 'nodes', id))
        } catch (e) {
            console.error("Error deleting node:", e)
        }
    }

    const handleAIAction = (action) => {
        if (action.action === 'create_node') addNode(action.nodeType, action.content)
    }

    if (!hasAccess) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
                <h1>Access Denied</h1>
                <p>You do not have permission to view this whiteboard.</p>
                <button onClick={() => navigate('/')} style={{ padding: '10px 20px', cursor: 'pointer' }}>Back to Dashboard</button>
            </div>
        )
    }

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            <ShareModal boardId={boardId} isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />

            {/* Top Navbar */}
            <motion.div
                className="glass-panel"
                style={{
                    position: 'absolute', top: 20, left: 20, right: 20,
                    padding: '10px 20px', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderRadius: 50, pointerEvents: 'auto'
                }}
                initial={{ y: -100 }} animate={{ y: 0 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Back to Dashboard"><FiHome /></button>
                    {isEditingTitle ? (
                        <input
                            autoFocus
                            value={boardTitle}
                            onChange={(e) => setBoardTitle(e.target.value)}
                            onBlur={async () => {
                                setIsEditingTitle(false)
                                await updateDoc(doc(db, 'boards', boardId), { title: boardTitle })
                            }}
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                    setIsEditingTitle(false)
                                    await updateDoc(doc(db, 'boards', boardId), { title: boardTitle })
                                }
                            }}
                            style={{ fontSize: '1.2rem', fontWeight: 700, border: '1px solid #ddd', borderRadius: 4, padding: '2px 5px', outline: 'none' }}
                        />
                    ) : (
                        <h1
                            onClick={() => setIsEditingTitle(true)}
                            style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, cursor: 'pointer', border: '1px solid transparent', padding: '2px 5px' }}
                            title="Click to rename"
                            onMouseEnter={(e) => e.target.style.border = '1px dashed #ccc'}
                            onMouseLeave={(e) => e.target.style.border = '1px solid transparent'}
                        >
                            {boardTitle}
                        </h1>
                    )}
                </div>

                {/* Collaborators */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', paddingRight: 10, borderRight: '1px solid #ddd' }}>
                        {collaborators.map(c => (
                            <img key={c.uid} src={c.photoURL} title={c.displayName} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid white', marginLeft: -10 }} />
                        ))}
                    </div>
                    <button onClick={() => setIsShareOpen(true)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <FiUserPlus /> Invite
                    </button>
                </div>
            </motion.div>

            {/* Canvas */}
            <div style={{ width: '100%', height: '100%' }}>
                <Whiteboard
                    nodes={nodes}
                    onAddNode={addNode}
                    onUpdateNodePosition={updateNodePosition}
                    onUpdateNodeData={updateNodeData}
                    onDeleteNode={deleteNode}
                />
            </div>

            {/* Chat */}
            <ChatInterface onAction={handleAIAction} />
        </div>
    )
}
