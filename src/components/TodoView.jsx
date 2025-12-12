import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheck, FiPlus, FiCalendar, FiClock, FiTag, FiTrash2, FiMoreHorizontal, FiCheckCircle, FiCircle, FiX } from 'react-icons/fi'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { GoogleGenerativeAI } from "@google/generative-ai"

export default function TodoView({ user, isOpen, onClose }) {
    const [todos, setTodos] = useState([])
    const [filter, setFilter] = useState('all') // all, today, upcoming
    const [newTodo, setNewTodo] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [isAIProcessing, setIsAIProcessing] = useState(false)

    // Sync Todos (Global for user for now, or could be per board if we pass boardId)
    // User requested "Sync with others", implying shared todos.
    // For now, let's make it User-Centric but stored in 'todos' root collection
    // with 'allowedEmails' or 'members' array for sharing.
    // Simpler Phase 2: Personal Todo list first? 
    // User said: "Sync with others". So it's a Shared Project.
    // Let's create a "projects" concept or just use "boards" as projects?
    // User said: "Project max 10 people". 
    // Let's stick to "Personal" + "Shared" filter.

    useEffect(() => {
        if (!user) return
        // Query todos where user is owner OR allowed (if we add sharing later)
        const q = query(
            collection(db, 'todos'),
            where('members', 'array-contains', user.email),
            orderBy('createdAt', 'desc')
        )
        const unsub = onSnapshot(q, (snap) => {
            setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        })
        return unsub
    }, [user])

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!newTodo.trim()) return
        try {
            await addDoc(collection(db, 'todos'), {
                text: newTodo,
                completed: false,
                createdAt: serverTimestamp(),
                members: [user.email], // Shared logic foundation
                ownerId: user.uid,
                ownerId: user.uid,
                dueDate: dueDate || null,
                labels: []
            })
            setNewTodo('')
            setDueDate('')
        } catch (err) { console.error(err) }
    }

    const toggleComplete = async (todo) => {
        await updateDoc(doc(db, 'todos', todo.id), { completed: !todo.completed })
    }

    const deleteTodo = async (id) => {
        await deleteDoc(doc(db, 'todos', id))
    }

    const convertToWhiteboard = async () => {
        if (todos.length === 0) return alert("No tasks to convert!")

        setIsAIProcessing(true)
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY
            if (!apiKey) throw new Error("API Key missing")

            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

            const taskList = todos.map(t => `- ${t.text} (Completed: ${t.completed})`).join('\n')

            const prompt = `
                You are an expert Project Manager. Transform this list of tasks into a structured Whiteboard layout.
                
                Tasks:
                ${taskList}
                
                Goal: Group these tasks into logical categories (e.g., 'To Do', 'In Progress', 'Done', or by topic like 'Marketing', 'Dev').
                
                Return ONLY a valid JSON object with this structure:
                {
                    "title": "Generated Project Board",
                    "nodes": [
                        { "id": "uuid", "type": "label", "text": "Category Name", "x": 0, "y": 0, "color": "#e0e0e0" },
                        { "id": "uuid", "type": "note", "text": "Task Content", "x": 0, "y": 100, "color": "#fff740" }
                    ]
                }
                
                Layout Rules:
                1. Place Category Labels horizontally (Spacing: 400px).
                2. Place Task Notes vertically below their Category Label (Spacing: 120px).
                3. Use valid UUIDs for IDs.
                4. Label color should be light gray #f5f5f5.
                5. Note color: #fff740 for pending, #b9f6ca for completed.
            `

            const result = await model.generateContent(prompt)
            const response = await result.response
            const text = response.text()

            // Clean Markdown code blocks if present
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
            const data = JSON.parse(jsonStr)

            // Create Board
            const boardRef = await addDoc(collection(db, 'boards'), {
                title: data.title || "AI Project Board",
                createdBy: user.uid,
                ownerId: user.uid,
                ownerEmail: user.email,
                createdAt: new Date().toISOString(),
                allowedEmails: [user.email],
                members: [user.uid],
                elements: [],
                folder: 'AI Generated'
            })

            // Batch Create Nodes
            const batchPromises = data.nodes.map(node =>
                setDoc(doc(db, `boards/${boardRef.id}/nodes`, node.id), {
                    type: node.type, // 'label' or 'note'
                    content: node.text,
                    x: node.x,
                    y: node.y,
                    color: node.color,
                    createdBy: user.uid,
                    createdAt: serverTimestamp(),
                    width: node.type === 'label' ? 300 : 200,
                    height: node.type === 'label' ? 50 : 200,
                    // Add Label-specific or Note-specific defaults
                    ...(node.type === 'label' ? { fontSize: 24, align: 'center' } : { fontSize: 16 })
                })
            )

            await Promise.all(batchPromises)

            setIsAIProcessing(false)
            alert("Board Created! Redirecting...")
            window.location.href = `/board/${boardRef.id}`

        } catch (error) {
            console.error("AI Error:", error)
            alert("AI Generation Failed: " + error.message)
            setIsAIProcessing(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    style={{
                        position: 'fixed', top: 70, right: 0, bottom: 0, width: 400,
                        background: 'white', borderLeft: '1px solid #ddd',
                        boxShadow: '-5px 0 20px rgba(0,0,0,0.05)',
                        zIndex: 900, display: 'flex', flexDirection: 'column'
                    }}
                >
                    <div style={{ padding: 20, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: '#db4c3f' }}>Done</span>Tick
                        </h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FiX size={20} /></button>
                    </div>

                    <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
                        <form onSubmit={handleAdd} style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    value={newTodo}
                                    onChange={e => setNewTodo(e.target.value)}
                                    placeholder="Add a task..."
                                    style={{
                                        width: '100%', padding: '12px 12px 12px 15px',
                                        borderRadius: 8, border: '1px solid #ddd',
                                        fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                style={{
                                    padding: '12px', borderRadius: 8, border: '1px solid #ddd',
                                    outline: 'none', fontFamily: 'inherit', color: '#666'
                                }}
                            />
                            <button type="submit" style={{ border: 'none', background: '#db4c3f', color: 'white', borderRadius: 8, padding: '0 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FiPlus size={20} />
                            </button>
                        </form>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {todos.map(todo => (
                                <motion.div
                                    key={todo.id}
                                    layout
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: 10, borderRadius: 8,
                                        background: todo.completed ? '#f9f9f9' : 'white',
                                        border: '1px solid transparent',
                                        boxShadow: todo.completed ? 'none' : '0 2px 5px rgba(0,0,0,0.02)',
                                        opacity: todo.completed ? 0.6 : 1
                                    }}
                                    whileHover={{ border: '1px solid #eee' }}
                                >
                                    <div onClick={() => toggleComplete(todo)} style={{ cursor: 'pointer', color: todo.completed ? '#aaa' : '#666' }}>
                                        {todo.completed ? <FiCheckCircle size={18} /> : <FiCircle size={18} />}
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ textDecoration: todo.completed ? 'line-through' : 'none', color: '#333' }}>
                                            {todo.text}
                                        </span>
                                        {todo.dueDate && (
                                            <span style={{ fontSize: '0.75rem', color: '#db4c3f', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                <FiCalendar size={10} /> {todo.dueDate}
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={() => deleteTodo(todo.id)} style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer' }}>
                                        <FiTrash2 />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div style={{ padding: 20, borderTop: '1px solid #eee', background: '#f8f9fa' }}>
                        <button
                            onClick={convertToWhiteboard}
                            disabled={isAIProcessing}
                            style={{
                                width: '100%', padding: 12, borderRadius: 8, border: 'none',
                                background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white',
                                fontWeight: 600, cursor: 'pointer', opacity: isAIProcessing ? 0.7 : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                            }}
                        >
                            {isAIProcessing ? 'Analyzing...' : 'AI: Convert to Whiteboard'}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
