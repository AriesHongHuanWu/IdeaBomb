import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import Whiteboard from './Whiteboard' // Sibling import
import ChatInterface from './ChatInterface'
import { db } from '../firebase' // Parent import
import { collection, onSnapshot, setDoc, doc, updateDoc, query, where, getDoc } from 'firebase/firestore'
import { FiHome, FiShare2, FiUsers } from 'react-icons/fi'

export default function BoardPage({ user }) {
    const { boardId } = useParams()
    const navigate = useNavigate()
    const [nodes, setNodes] = useState([])
    const [boardTitle, setBoardTitle] = useState('Loading...')
    const [collaborators, setCollaborators] = useState([])

    // 1. Sync Board Metadata (Title)
    useEffect(() => {
        if (!boardId) return
        const unsub = onSnapshot(doc(db, 'boards', boardId), (docSnap) => {
            if (docSnap.exists()) {
                setBoardTitle(docSnap.data().title)
            } else {
                // Handle 404
                setBoardTitle('Board Not Found')
            }
        })
        return unsub
    }, [boardId])

    // 2. Sync Nodes (Sub-collection)
    useEffect(() => {
        if (!boardId) return
        const q = collection(db, 'boards', boardId, 'nodes')
        const unsub = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            setNodes(loaded)
        })
        return unsub
    }, [boardId])

    // 3. Presence System (Simple: Write my user info to subcollection 'presence')
    useEffect(() => {
        if (!user || !boardId) return
        const presenceRef = doc(db, 'boards', boardId, 'presence', user.uid)
        // Write presence on mount / update every 1 min (Heartbeat) - skipping complex heartbeat for now
        setDoc(presenceRef, {
            uid: user.uid,
            photoURL: user.photoURL,
            displayName: user.displayName,
            lastActive: new Date().toISOString()
        })

        // Listen to presence
        const unsub = onSnapshot(collection(db, 'boards', boardId, 'presence'), (snap) => {
            setCollaborators(snap.docs.map(d => d.data()))
        })
        return () => { unsub() } // Cleanup
    }, [user, boardId])

    // Logic Functions (Same as before, but path includes boardId)
    const addNode = async (type, content) => {
        if (!user) return
        const newNode = {
            id: uuidv4(),
            type: type || 'Note',
            x: window.innerWidth / 2 - 140 + (Math.random() * 40 - 20),
            y: window.innerHeight / 2 - 100 + (Math.random() * 40 - 20),
            content: content || (type === 'Todo' ? '- [ ] New Task' : 'New Item'),
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

    const handleAIAction = (action) => {
        if (action.action === 'create_node') addNode(action.nodeType, action.content)
    }

    const copyInviteLink = () => {
        navigator.clipboard.writeText(window.location.href)
        alert("Link copied! Share it with friends.")
    }

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
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
                    <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>{boardTitle}</h1>
                </div>

                {/* Collaborators */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', paddingRight: 10, borderRight: '1px solid #ddd' }}>
                        {collaborators.map(c => (
                            <img key={c.uid} src={c.photoURL} title={c.displayName} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid white', marginLeft: -10 }} />
                        ))}
                    </div>
                    <button onClick={copyInviteLink} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <FiShare2 /> Invite
                    </button>
                </div>
            </motion.div>

            {/* Canvas */}
            <div style={{ width: '100%', height: '100%' }}>
                <Whiteboard nodes={nodes} onAddNode={addNode} onUpdateNodePosition={updateNodePosition} />
            </div>

            {/* Chat */}
            <ChatInterface onAction={handleAIAction} />
        </div>
    )
}
