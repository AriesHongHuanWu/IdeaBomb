import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiMenu, FiHome, FiPlus, FiCheck, FiMoreHorizontal, FiCalendar, FiFlag } from 'react-icons/fi'
import TaskSidebar from './TaskSidebar'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { auth, db } from '../firebase'
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore'

export default function TasksPage({ user }) {
    const navigate = useNavigate()
    const isMobile = useMediaQuery('(max-width: 768px)')
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
    const [activeView, setActiveView] = useState('inbox') // 'inbox', 'today', 'upcoming' or listId
    const [taskLists, setTaskLists] = useState([])
    const [tasks, setTasks] = useState([])
    const [inputFocus, setInputFocus] = useState(false)
    const [newTaskContent, setNewTaskContent] = useState('')

    // --- Firestore Listeners ---

    // 1. Listen to Task Lists (Projects)
    useEffect(() => {
        if (!user) return
        // Fetch only lists owned by valid users? Or public?
        // Implementing basic query: Lists where I am owner (or maybe collaborator later)
        const q = query(collection(db, 'task_lists'), where('ownerId', '==', user.uid));
        const unsub = onSnapshot(q, (snap) => {
            setTaskLists(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        })
        return unsub
    }, [user])

    // 2. Listen to Tasks (Global)
    // NOTE: In production, might be better to query PER LIST. But for now, user-specific tasks global query.
    useEffect(() => {
        if (!user) return
        const q = query(
            collection(db, 'task_lists'),
            where('ownerId', '==', user.uid)
        );
        // This is tricky. We need tasks across ALL lists.
        // Option A: Collection Group Query (requires index)
        // Option B: Query `tasks` subcollection of each list? Too many listeners.
        // Option C: We use a root-level `tasks` collection? 
        // -> My plan said: `task_lists/{listId}/tasks`
        // -> For "Inbox" / "Today", we need to aggregate.
        // Let's implement: ActiveView determines the listener.

        let unsub = () => { }

        if (['inbox', 'today', 'upcoming'].includes(activeView)) {
            // Wait: If structured as subcollections, a Collection Group Query is needed.
            // "db.collectionGroup('tasks').where('assigneeId', '==', user.uid)"
            // Let's assume for MVP: Tasks are stored in a ROOT `tasks` collection for easier prototyping?
            // OR: We stick to subcollections and use collectionGroup.
            // Let's stick to the Plan: `task_lists` > `tasks`.
            // We need a collection group index for `assigneeId` or `ownerId`.
            // For now, to avoid index setup delay, let's just query the "Inbox" list explicitly.
            // We need a default "Inbox" list for every user.

            // Temporary Fallback: Just query the ACTIVE list. If 'inbox', find the list named 'Inbox'.
        } else {
            // Specific List
            const qTasks = query(collection(db, 'task_lists', activeView, 'tasks'), orderBy('createdAt', 'asc'));
            unsub = onSnapshot(qTasks, (snap) => {
                setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
            })
        }

        return () => unsub()
    }, [user, activeView])

    // --- Actions ---
    const handleAddTask = async (e) => {
        if ((e.key === 'Enter' || e.type === 'click') && newTaskContent.trim()) {
            if (activeView === 'inbox' || activeView === 'today' || activeView === 'upcoming') {
                alert("Please select a specific project/list to add tasks (Global Inbox not yet setup)")
                return
            }
            try {
                await addDoc(collection(db, 'task_lists', activeView, 'tasks'), {
                    content: newTaskContent,
                    isCompleted: false,
                    createdAt: serverTimestamp(),
                    priority: 4
                })
                setNewTaskContent('')
            } catch (err) {
                console.error(err)
            }
        }
    }

    const toggleComplete = async (task) => {
        try {
            await updateDoc(doc(db, 'task_lists', activeView, 'tasks', task.id), {
                isCompleted: !task.isCompleted
            })
        } catch (err) { console.error(err) }
    }

    const deleteTask = async (taskId) => {
        try {
            await deleteDoc(doc(db, 'task_lists', activeView, 'tasks', taskId))
        } catch (err) { console.error(err) }
    }

    // --- Temporary List Creation for Testing ---
    const createList = async () => {
        const name = prompt("List Name?")
        if (name) {
            await addDoc(collection(db, 'task_lists'), {
                title: name,
                ownerId: user.uid,
                color: '#666'
            })
        }
    }

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%', background: '#fff', fontFamily: '"Inter", sans-serif' }}>
            {/* Sidebar */}
            <AnimatePresence mode="popLayout">
                {(!isMobile || sidebarOpen) && (
                    <motion.div
                        initial={isMobile ? { x: -280 } : false}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ duration: 0.2 }}
                        style={{ height: '100%', zIndex: 10 }}
                    >
                        <TaskSidebar
                            activeView={activeView}
                            setActiveView={(v) => { setActiveView(v); if (isMobile) setSidebarOpen(false) }}
                            lists={taskLists}
                            onAddList={createList}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                {/* Header */}
                <div style={{
                    height: 60, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 15,
                    background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
                    position: 'sticky', top: 0, zIndex: 5
                }}>
                    {isMobile && <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', fontSize: '1.2rem' }}><FiMenu /></button>}
                    <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#555' }}>
                        <FiHome />
                    </button>
                    <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, color: '#202020' }}>
                        {taskLists.find(l => l.id === activeView)?.title || activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                    </h2>
                </div>

                {/* Task List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 5%' }}>

                        {/* Tasks Reorder Group */}
                        <Reorder.Group axis="y" values={tasks} onReorder={setTasks} style={{ listStyle: 'none', padding: 0 }}>
                            <AnimatePresence initial={false}>
                                {tasks.map(task => (
                                    <Reorder.Item key={task.id} value={task}
                                        style={{ background: 'white', position: 'relative', overflow: 'hidden' }}
                                        whileDrag={{ scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', borderRadius: 8, zIndex: 50 }}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="task-row" style={{
                                            padding: '12px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', gap: 12,
                                            opacity: task.isCompleted ? 0.6 : 1, transition: '0.2s'
                                        }}>
                                            {/* Checkbox */}
                                            <div
                                                onClick={() => toggleComplete(task)}
                                                style={{
                                                    marginTop: 2,
                                                    width: 20, height: 20, borderRadius: '50%',
                                                    border: task.isCompleted ? '2px solid #058527' : '2px solid #ccc',
                                                    background: task.isCompleted ? '#058527' : 'transparent',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontSize: '12px', flexShrink: 0
                                                }}
                                            >
                                                {task.isCompleted && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><FiCheck /></motion.div>}
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: '0.95rem', color: task.isCompleted ? '#aaa' : '#333',
                                                    textDecoration: task.isCompleted ? 'line-through' : 'none',
                                                    lineHeight: 1.5,
                                                    wordBreak: 'break-word',
                                                    transition: 'color 0.2s, text-decoration 0.2s'
                                                }}>
                                                    {task.content}
                                                </div>
                                                <div style={{ marginTop: 4, display: 'flex', gap: 12, fontSize: '0.75rem', color: '#888' }}>
                                                    {task.priority && <span style={{ color: task.priority === 1 ? '#d93025' : '#888', display: 'flex', alignItems: 'center', gap: 4 }}><FiFlag /> P{task.priority}</span>}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="task-actions" style={{ opacity: 0, transition: '0.2s' }}>
                                                <button onClick={() => deleteTask(task.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d93025' }}><FiMoreHorizontal /></button>
                                            </div>
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </AnimatePresence>
                        </Reorder.Group>

                        {/* Add Task Input */}
                        <motion.div
                            layout
                            style={{ marginTop: 10, cursor: 'text' }}
                            onClick={() => setInputFocus(true)}
                        >
                            {!inputFocus ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', color: '#666' }}>
                                    <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d93025' }}><FiPlus size={20} /></div>
                                    <span style={{ fontSize: '0.95rem' }}>Add task</span>
                                </div>
                            ) : (
                                <div style={{
                                    border: '1px solid #ddd', borderRadius: 12, padding: 12,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: 'white'
                                }}>
                                    <input
                                        autoFocus
                                        placeholder="Task name"
                                        value={newTaskContent}
                                        onChange={e => setNewTaskContent(e.target.value)}
                                        onKeyDown={handleAddTask}
                                        style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.95rem', marginBottom: 12 }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: 8 }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #eee', background: 'white', color: '#555', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FiCalendar /> Due date</button>
                                            <button style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #eee', background: 'white', color: '#555', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FiFlag /> Priority</button>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => setInputFocus(false)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#f5f5f5', color: '#555', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                            <button onClick={handleAddTask} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#d93025', color: 'white', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>Add task</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* CSS for Task Hover Actions */}
                        <style>{`
                            .task-row:hover .task-actions { opacity: 1 !important; }
                        `}</style>
                    </div>
                </div>
            </div>
        </div>
    )
}
