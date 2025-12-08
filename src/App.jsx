import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import Whiteboard from './components/Whiteboard'
import ChatInterface from './components/ChatInterface'

function App() {
    // 1. Persistent State: Load from LocalStorage
    const [nodes, setNodes] = useState(() => {
        const saved = localStorage.getItem('whiteboard_nodes')
        return saved ? JSON.parse(saved) : [
            { id: '1', type: 'Todo', x: 100, y: 100, content: '- [ ] Project Planning\n- [ ] Design Review' },
            { id: '2', type: 'Calendar', x: 500, y: 150, content: 'Dec 25: Launch Day' }
        ]
    })

    // Save to LocalStorage whenever nodes change
    useEffect(() => {
        localStorage.setItem('whiteboard_nodes', JSON.stringify(nodes))
    }, [nodes])

    // Add Node Function (Used by Toolbar and AI)
    const addNode = (type, content) => {
        setNodes(prev => [...prev, {
            id: uuidv4(),
            type: type || 'Note',
            x: window.innerWidth / 2 - 140 + (Math.random() * 40 - 20),
            y: window.innerHeight / 2 - 100 + (Math.random() * 40 - 20),
            content: content || (type === 'Todo' ? '- [ ] New Task' : 'New Item')
        }])
    }

    // Update Node Position (from Dragging)
    const updateNodePosition = (id, offset) => {
        setNodes(prev => prev.map(n =>
            n.id === id ? { ...n, x: n.x + offset.x, y: n.y + offset.y } : n
        ))
    }

    // Handle Actions from AI Chat
    const handleAIAction = (action) => {
        console.log("AI Action:", action)
        if (action.action === 'create_node') {
            addNode(action.nodeType, action.content)
        }
    }

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            {/* Top Bar */}
            <motion.div
                className="glass-panel"
                style={{
                    position: 'absolute', top: 20, left: '50%', x: '-50%',
                    padding: '10px 30px', zIndex: 100, display: 'flex', alignItems: 'center', gap: 20
                }}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
            >
                <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>
                    Collab<span style={{ color: 'var(--primary)' }}>Whiteboard</span>
                </h1>
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
