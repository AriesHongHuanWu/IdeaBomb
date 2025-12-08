import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import Whiteboard from './components/Whiteboard'
import ChatInterface from './components/ChatInterface'
import Login from './components/Login'
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, onSnapshot, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'

function App() {
    const [user, setUser] = useState(null)
    const [nodes, setNodes] = useState([])

    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u)
        })
        return unsubscribe
    }, [])

    // Realtime Nodes Listener
    useEffect(() => {
        if (!user) {
            setNodes([])
            return
        }

        // Listen to 'nodes' collection
        const unsubscribe = onSnapshot(collection(db, 'nodes'), (snapshot) => {
            const loadedNodes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setNodes(loadedNodes)
        }, (error) => {
            console.error("Firestore Error:", error)
        })

        return unsubscribe
    }, [user])

    // Add Node (Writes to Firestore)
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
            // Use setDoc with specific ID
            await setDoc(doc(db, 'nodes', newNode.id), newNode)
        } catch (e) {
            console.error("Error adding node:", e)
        }
    }

    // Update Node Position (Writes to Firestore)
    const updateNodePosition = async (id, offset) => {
        const node = nodes.find(n => n.id === id)
        if (!node) return

        try {
            await updateDoc(doc(db, 'nodes', id), {
                x: node.x + offset.x,
                y: node.y + offset.y
            })
        } catch (e) {
            console.error("Error updating node:", e)
        }
    }

    // Handle Actions from AI Chat
    const handleAIAction = (action) => {
        console.log("AI Action:", action)
        if (action.action === 'create_node') {
            addNode(action.nodeType, action.content)
        }
    }

    if (!user) {
        return <Login />
    }

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            {/* Top Bar */}
            <motion.div
                className="glass-panel"
                style={{
                    position: 'absolute', top: 20, left: '50%', x: '-50%',
                    padding: '8px 20px', zIndex: 100, display: 'flex', alignItems: 'center', gap: 20,
                    borderRadius: 50
                }}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
            >
                <h1 style={{ fontSize: '1rem', margin: 0, fontWeight: 700 }}>
                    Idea<span style={{ color: 'var(--primary)' }}>Bomb</span>
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={user.photoURL} style={{ width: 24, height: 24, borderRadius: '50%' }} alt="User" />
                    <button onClick={() => signOut(auth)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#666' }}>Sign Out</button>
                </div>
            </motion.div>

            {/* Main Content Area */}
            <div id="canvas-area" style={{ width: '100%', height: '100%' }}>
                <Whiteboard
                    nodes={nodes}
                    onAddNode={addNode}
                    onUpdateNodePosition={updateNodePosition}
                />
            </div>

            {/* Chat Assistant */}
            <ChatInterface onAction={handleAIAction} />
        </div>
    )
}

export default App
