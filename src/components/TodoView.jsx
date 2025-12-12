import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FiCheck, FiPlus, FiCalendar, FiClock, FiTag, FiTrash2, FiMoreHorizontal,
    FiCheckCircle, FiCircle, FiX, FiInbox, FiSun, FiCalendar as FiUpcoming,
    FiFlag, FiMenu, FiChevronRight, FiChevronDown
} from 'react-icons/fi'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { GoogleGenerativeAI } from "@google/generative-ai"

// --- Components ---

const PriorityFlag = ({ priority, selected, onClick }) => {
    const colors = {
        1: '#d1453b', // Red
        2: '#eb8909', // Orange
        3: '#246fe0', // Blue
        4: '#808080'  // Grey
    }
    return (
        <div
            onClick={onClick}
            style={{
                color: colors[priority],
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 4,
                background: selected ? 'rgba(0,0,0,0.05)' : 'transparent',
                border: selected ? '1px solid rgba(0,0,0,0.1)' : '1px solid transparent'
            }}
            title={`Priority ${priority}`}
        >
            <FiFlag fill={selected ? colors[priority] : 'none'} />
            {selected && <span style={{ fontSize: '0.8rem' }}>P{priority}</span>}
        </div>
    )
}

export default function TodoView({ user, isOpen, onClose }) {
    const [todos, setTodos] = useState([])
    const [activeView, setActiveView] = useState('inbox') // inbox, today, upcoming
    const [newTodo, setNewTodo] = useState('')
    const [newTodoDate, setNewTodoDate] = useState('')
    const [newTodoPriority, setNewTodoPriority] = useState(4) // 4 = normal
    const [isAIProcessing, setIsAIProcessing] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    // --- Data Sync ---
    useEffect(() => {
        if (!user) return
        const q = query(
            collection(db, 'todos'),
            where('members', 'array-contains', user.email),
            orderBy('createdAt', 'desc') // Basic ordering for now
        )
        const unsub = onSnapshot(q, (snap) => {
            setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        })
        return unsub
    }, [user])

    // --- Filtering Logic ---
    const getFilteredTodos = () => {
        const today = new Date().toISOString().split('T')[0]

        return todos.filter(t => {
            if (activeView === 'inbox') return true
            if (activeView === 'today') return t.dueDate === today
            if (activeView === 'upcoming') return t.dueDate && t.dueDate > today
            return true
        }).sort((a, b) => {
            // Sort by Priority (asc, 1 is high) then Date
            if ((a.priority || 4) !== (b.priority || 4)) return (a.priority || 4) - (b.priority || 4)
            return 0
        })
    }

    const filteredTodos = getFilteredTodos()

    // --- Actions ---
    const handleAdd = async (e) => {
        e.preventDefault()
        if (!newTodo.trim()) return
        try {
            await addDoc(collection(db, 'todos'), {
                text: newTodo,
                completed: false,
                createdAt: serverTimestamp(),
                members: [user.email],
                ownerId: user.uid,
                dueDate: newTodoDate || null,
                priority: newTodoPriority, // 1, 2, 3, 4
                labels: []
            })
            setNewTodo('')
            setNewTodoDate('')
            setNewTodoPriority(4)
        } catch (err) { console.error(err) }
    }

    const toggleComplete = async (todo) => {
        // Optimistic update could go here
        await updateDoc(doc(db, 'todos', todo.id), { completed: !todo.completed })
    }

    const deleteTodo = async (id) => {
        await deleteDoc(doc(db, 'todos', id))
    }

    const updatePriority = async (id, p) => {
        await updateDoc(doc(db, 'todos', id), { priority: p })
    }

    // --- AI Conversion ---
    const convertToWhiteboard = async () => {
        if (todos.length === 0) return alert("No tasks to convert!")
        setIsAIProcessing(true)
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY
            if (!apiKey) throw new Error("API Key missing")

            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash-lite" })

            const taskList = todos.map(t => `- [P${t.priority || 4}] ${t.text} (Due: ${t.dueDate || 'None'})`).join('\n')

            const prompt = `
                Act as a Project Manager using Kanban.
                Convert these tasks into a Whiteboard JSON structure.
                
                Tasks:
                ${taskList}
                
                Group high priority (P1, P2) separately from normal tasks.
                
                Return JSON structure for nodes:
                {
                    "title": "Kanban Board",
                    "nodes": [ ... ]
                }
                Use valid UUIDs.
            `

            const result = await model.generateContent(prompt)
            const text = (await result.response).text()
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
            const data = JSON.parse(jsonStr)

            const boardRef = await addDoc(collection(db, 'boards'), {
                title: data.title || "Todoist Import",
                createdBy: user.uid,
                ownerId: user.uid,
                ownerEmail: user.email,
                createdAt: new Date().toISOString(),
                allowedEmails: [user.email],
                members: [user.uid],
                elements: [],
                folder: 'Imports'
            })

            const batchPromises = data.nodes.map(node =>
                setDoc(doc(db, `boards/${boardRef.id}/nodes`, node.id), {
                    type: node.type || 'note',
                    content: node.text || node.content,
                    x: node.x || 0,
                    y: node.y || 0,
                    color: node.color || '#fff',
                    createdBy: user.uid,
                    createdAt: serverTimestamp(),
                    width: 200, height: 200
                })
            )

            await Promise.all(batchPromises)
            window.location.href = `/board/${boardRef.id}`

        } catch (error) {
            console.error("AI Error:", error)
            alert("AI Generation Failed: " + error.message)
        } finally {
            setIsAIProcessing(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    style={{
                        position: 'fixed', top: 70, right: 0, bottom: 0,
                        width: '100%', maxWidth: 700, // Wider for fuller experience
                        background: 'white', borderLeft: '1px solid #ddd',
                        boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
                        zIndex: 900, display: 'flex'
                    }}
                >
                    {/* --- Sidebar (Navigation) --- */}
                    <div style={{
                        width: 200, background: '#fafafa', borderRight: '1px solid #eee',
                        padding: '20px 0', display: isMobile ? 'none' : 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ padding: '0 20px 20px', fontWeight: 'bold', fontSize: '1.1rem', color: '#db4c3f', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FiCheckCircle /> IdeaBomb
                        </div>

                        <div
                            onClick={() => setActiveView('inbox')}
                            style={{ padding: '8px 20px', cursor: 'pointer', background: activeView === 'inbox' ? '#fff' : 'transparent', fontWeight: activeView === 'inbox' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: 10, color: activeView === 'inbox' ? '#333' : '#666' }}
                        >
                            <FiInbox color="#246fe0" /> Inbox
                            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#aaa' }}>{todos.length}</span>
                        </div>
                        <div
                            onClick={() => setActiveView('today')}
                            style={{ padding: '8px 20px', cursor: 'pointer', background: activeView === 'today' ? '#fff' : 'transparent', fontWeight: activeView === 'today' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: 10, color: activeView === 'inbox' ? '#333' : '#666' }}
                        >
                            <FiSun color="#058527" /> Today
                        </div>
                        <div
                            onClick={() => setActiveView('upcoming')}
                            style={{ padding: '8px 20px', cursor: 'pointer', background: activeView === 'upcoming' ? '#fff' : 'transparent', fontWeight: activeView === 'upcoming' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: 10, color: activeView === 'inbox' ? '#333' : '#666' }}
                        >
                            <FiUpcoming color="#692fc2" /> Upcoming
                        </div>

                        <div style={{ marginTop: 'auto', padding: 20 }}>
                            <button
                                onClick={convertToWhiteboard}
                                disabled={isAIProcessing}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                                    background: '#f0f0f0', color: '#333', fontSize: '0.8rem',
                                    cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                {isAIProcessing ? '✨ Processing...' : '✨ To Whiteboard'}
                            </button>
                        </div>
                    </div>

                    {/* --- Main Content --- */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

                        {/* Header */}
                        <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                                {activeView === 'inbox' && 'Inbox'}
                                {activeView === 'today' && 'Today'}
                                {activeView === 'upcoming' && 'Upcoming'}
                            </h2>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5 }}><FiX size={20} color="#666" /></button>
                        </div>

                        {/* Task List */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

                            {filteredTodos.map(todo => (
                                <div
                                    key={todo.id}
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 15, position: 'relative',
                                        padding: '10px 0', borderBottom: '1px solid #f5f5f5'
                                    }}
                                >
                                    {/* Checkbox with Priority Color */}
                                    <div
                                        onClick={() => toggleComplete(todo)}
                                        style={{
                                            cursor: 'pointer', marginTop: 3,
                                            width: 18, height: 18, borderRadius: '50%',
                                            border: `2px solid ${todo.priority === 1 ? '#d1453b' : todo.priority === 2 ? '#eb8909' : todo.priority === 3 ? '#246fe0' : '#ccc'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: todo.completed ? '#f0f0f0' : 'transparent'
                                        }}
                                    >
                                        {todo.completed && <FiCheck size={12} color="#aaa" />}
                                    </div>

                                    {/* Task Content */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            textDecoration: todo.completed ? 'line-through' : 'none',
                                            color: todo.completed ? '#aaa' : '#202020',
                                            fontSize: '0.95rem', lineHeight: '1.5'
                                        }}>
                                            {todo.text}
                                        </div>
                                        {todo.dueDate && (
                                            <div style={{ fontSize: '0.75rem', color: '#d1453b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <FiCalendar size={10} /> {todo.dueDate}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 5, opacity: 0.5 }}>
                                        <div style={{ fontSize: '0.7rem', color: '#999', marginTop: 5 }}>P{todo.priority || 4}</div>
                                        <button onClick={() => deleteTodo(todo.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999' }}>
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Standard "Add Task" Row */}
                            <form onSubmit={handleAdd} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid #ddd', borderRadius: 10, padding: 10 }}>
                                <input
                                    value={newTodo}
                                    onChange={e => setNewTodo(e.target.value)}
                                    placeholder="Add a task..."
                                    style={{
                                        border: 'none', outline: 'none', fontSize: '1rem', fontWeight: 500
                                    }}
                                    autoFocus
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {/* Date Picker Trigger (Simple native for now) */}
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <input
                                                type="date"
                                                value={newTodoDate}
                                                onChange={e => setNewTodoDate(e.target.value)}
                                                style={{
                                                    position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer'
                                                }}
                                            />
                                            <button type="button" style={{
                                                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 4,
                                                border: '1px solid #ccc', background: 'white', color: newTodoDate ? '#d1453b' : '#666', fontSize: '0.8rem', pointerEvents: 'none'
                                            }}>
                                                <FiCalendar /> {newTodoDate || 'Due date'}
                                            </button>
                                        </div>

                                        {/* Priority Selector */}
                                        <div style={{ display: 'flex', gap: 2 }}>
                                            {[1, 2, 3, 4].map(p => (
                                                <PriorityFlag
                                                    key={p}
                                                    priority={p}
                                                    selected={newTodoPriority === p}
                                                    onClick={() => setNewTodoPriority(p)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newTodo}
                                        style={{
                                            background: newTodo ? '#db4c3f' : '#f0f0f0',
                                            color: newTodo ? 'white' : '#aaa',
                                            border: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 'bold', cursor: newTodo ? 'pointer' : 'default'
                                        }}
                                    >
                                        Add Task
                                    </button>
                                </div>
                            </form>

                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
