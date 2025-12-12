import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiMenu, FiHome, FiPlus } from 'react-icons/fi'
import TaskSidebar from './TaskSidebar'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { auth, db } from '../firebase'
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'

export default function TasksPage({ user }) {
    const navigate = useNavigate()
    const isMobile = useMediaQuery('(max-width: 768px)')
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
    const [activeView, setActiveView] = useState('inbox')
    const [taskLists, setTaskLists] = useState([])
    const [tasks, setTasks] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // --- Mock Data for Scaffolding ---
    useEffect(() => {
        // In real impl, fetch from 'task_lists' and 'tasks'
        setTaskLists([
            { id: '1', title: 'Website Redesign' },
            { id: '2', title: 'Marketing Campaign' }
        ])
        setTasks([
            { id: 't1', content: 'Fix header bug', listId: '1', isCompleted: false },
            { id: 't2', content: 'Draft email copy', listId: '2', isCompleted: false },
            { id: 't3', content: 'Buy groceries', listId: 'inbox', isCompleted: true },
        ])
        setIsLoading(false)
    }, [])

    const filteredTasks = tasks.filter(t => {
        if (activeView === 'inbox') return t.listId === 'inbox'
        if (activeView === 'today') return true // TODO: Date check
        if (activeView === 'upcoming') return true // TODO: Date check
        return t.listId === activeView
    })

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%', background: '#fff' }}>
            {/* Sidebar (Desktop) */}
            {!isMobile && sidebarOpen && (
                <TaskSidebar
                    activeView={activeView}
                    setActiveView={setActiveView}
                    lists={taskLists}
                    onAddList={() => { }}
                />
            )}

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header */}
                <div style={{
                    height: 60, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 15,
                    background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)'
                }}>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#555' }}>
                        <FiMenu />
                    </button>
                    <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#555' }}>
                        <FiHome />
                    </button>
                    <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>
                        {activeView === 'inbox' ? 'Inbox' :
                            activeView === 'today' ? 'Today' :
                                activeView === 'upcoming' ? 'Upcoming' :
                                    taskLists.find(l => l.id === activeView)?.title || 'Tasks'}
                    </h2>
                </div>

                {/* Task List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px max(5%, 40px)' }}>
                    <div style={{ maxWidth: 800, margin: '0 auto' }}>

                        {/* Task Input (Quick Add) */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid #f0f0f0', color: '#aaa', cursor: 'pointer' }}>
                                <FiPlus style={{ color: '#d93025', fontSize: '1.2rem' }} />
                                <span style={{ fontSize: '0.95rem' }}>Add task</span>
                            </div>
                        </div>

                        {/* Tasks */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {filteredTasks.map(task => (
                                <div key={task.id} style={{
                                    padding: '12px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12
                                }}>
                                    <div style={{
                                        width: 20, height: 20, borderRadius: '50%', border: '2px solid #ccc', cursor: 'pointer'
                                    }} />
                                    <span style={{
                                        flex: 1, fontSize: '0.95rem', color: task.isCompleted ? '#aaa' : '#333',
                                        textDecoration: task.isCompleted ? 'line-through' : 'none'
                                    }}>{task.content}</span>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
