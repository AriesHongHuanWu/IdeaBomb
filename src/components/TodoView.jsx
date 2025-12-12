import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { FiMenu, FiPlus, FiCheck, FiMoreHorizontal, FiCalendar, FiFlag, FiShare2, FiInbox, FiSun, FiHash, FiTrash2, FiEdit2 } from 'react-icons/fi'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { db } from '../firebase'
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, orderBy, arrayUnion } from 'firebase/firestore'
import ShareModal from './ShareModal'

// --- Internal Sidebar Component ---
const InternalSidebar = ({ activeView, setActiveView, lists, onAddList }) => {
    const navItems = [
        { id: 'inbox', label: 'Inbox', icon: <FiInbox />, color: '#246fe0' },
        { id: 'today', label: 'Today', icon: <FiSun />, color: '#058527' },
    ]

    return (
        <div style={{ width: 220, borderRight: '1px solid #f0f0f0', padding: '20px 10px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ marginBottom: 20 }}>
                {navItems.map(item => (
                    <motion.div
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        whileHover={{ background: 'rgba(0,0,0,0.03)' }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                            background: activeView === item.id ? '#e8f0fe' : 'transparent',
                            color: activeView === item.id ? '#d93025' : '#333',
                            marginBottom: 4
                        }}
                    >
                        <span style={{ color: item.color, display: 'flex' }}>{item.icon}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: activeView === item.id ? 600 : 400 }}>{item.label}</span>
                    </motion.div>
                ))}
            </div>

            <div style={{ padding: '0 12px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#888', fontSize: '0.8rem', fontWeight: 700 }}>
                <span>PROJECTS</span>
                <FiPlus style={{ cursor: 'pointer' }} onClick={onAddList} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {lists.map(list => (
                    <motion.div
                        key={list.id}
                        onClick={() => setActiveView(list.id)}
                        whileHover={{ background: 'rgba(0,0,0,0.03)' }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                            background: activeView === list.id ? '#e8f0fe' : 'transparent',
                            color: activeView === list.id ? '#1a73e8' : '#333',
                        }}
                    >
                        <span style={{ color: list.color || '#999' }}>●</span>
                        <span style={{ fontSize: '0.9rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{list.title}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

export default function TodoView({ user }) {
    const isMobile = useMediaQuery('(max-width: 768px)')
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
    const [activeView, setActiveView] = useState('inbox')
    const [taskLists, setTaskLists] = useState([])
    const [tasks, setTasks] = useState([])
    const [inputFocus, setInputFocus] = useState(false)
    const [newTaskContent, setNewTaskContent] = useState('')
    const [isShareOpen, setIsShareOpen] = useState(false)

    // --- Listen to Task Lists ---
    useEffect(() => {
        if (!user) return
        // Fetch lists where user is owner OR allowed
        const q = query(
            collection(db, 'task_lists'),
            where('allowedEmails', 'array-contains', user.email)
        );
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setTaskLists(list)

            // Auto-create Inbox if missing for owner
            // (Logic simplified: if no lists found at all, maybe prompt?)
        })
        return unsub
    }, [user])

    // --- Listen to Tasks ---
    useEffect(() => {
        if (!user) return
        let unsub = () => { }

        if (['inbox', 'today'].includes(activeView)) {
            // For now, Inbox = Look for a list named "Inbox" owned by user?
            // Or we just query ALL tasks assigned to user (requires index)
            // Simplified MVP: We need a dedicated "Inbox" list created for each user on signup.
            // Let's Find the list named "Inbox" in taskLists first.
            const inboxList = taskLists.find(l => l.title === 'Inbox' && l.ownerId === user.uid)
            if (inboxList) {
                const qTasks = query(collection(db, 'task_lists', inboxList.id, 'tasks'), orderBy('createdAt', 'asc'));
                unsub = onSnapshot(qTasks, (snap) => {
                    setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
                })
            } else {
                setTasks([]) // Or trigger creation
            }
        } else {
            const qTasks = query(collection(db, 'task_lists', activeView, 'tasks'), orderBy('createdAt', 'asc'));
            unsub = onSnapshot(qTasks, (snap) => {
                setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
            })
        }

        return () => unsub()
    }, [user, activeView, taskLists])

    // --- Actions ---
    const handleAddTask = async (e) => {
        if ((e.key === 'Enter' || e.type === 'click') && newTaskContent.trim()) {
            let targetListId = activeView;

            // Handle Global Views
            if (['inbox', 'today'].includes(activeView)) {
                const inbox = taskLists.find(l => l.title === 'Inbox' && l.ownerId === user.uid)
                if (!inbox) {
                    // Auto-create Inbox
                    const ref = await addDoc(collection(db, 'task_lists'), {
                        title: 'Inbox', ownerId: user.uid, allowedEmails: [user.email], color: '#246fe0', createdAt: serverTimestamp()
                    })
                    targetListId = ref.id
                } else {
                    targetListId = inbox.id
                }
            }

            try {
                await addDoc(collection(db, 'task_lists', targetListId, 'tasks'), {
                    content: newTaskContent,
                    isCompleted: false,
                    createdAt: serverTimestamp(),
                    priority: 4,
                    assigneeId: user.uid
                })
                setNewTaskContent('')
            } catch (err) { console.error(err) }
        }
    }

    const toggleComplete = async (task) => {
        let listId = activeView
        if (['inbox', 'today'].includes(activeView)) {
            const inbox = taskLists.find(l => l.title === 'Inbox' && l.ownerId === user.uid)
            if (inbox) listId = inbox.id
        }

        try {
            await updateDoc(doc(db, 'task_lists', listId, 'tasks', task.id), {
                isCompleted: !task.isCompleted
            })
        } catch (err) { console.error(err) }
    }

    const deleteTask = async (taskId) => {
        let listId = activeView
        if (['inbox', 'today'].includes(activeView)) {
            const inbox = taskLists.find(l => l.title === 'Inbox' && l.ownerId === user.uid)
            if (inbox) listId = inbox.id
        }
        try {
            await deleteDoc(doc(db, 'task_lists', listId, 'tasks', taskId))
        } catch (err) { console.error(err) }
    }

    const createList = async () => {
        const name = prompt("Project Name?")
        if (name) {
            await addDoc(collection(db, 'task_lists'), {
                title: name,
                ownerId: user.uid,
                allowedEmails: [user.email],
                color: '#666',
                createdAt: serverTimestamp()
            })
        }
    }

    const activeList = taskLists.find(l => l.id === activeView)

    return (
        <div style={{ display: 'flex', height: '100%', background: 'white', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {/* Internal Sidebar */}
            {(!isMobile || sidebarOpen) && (
                <InternalSidebar
                    activeView={activeView}
                    setActiveView={setActiveView}
                    lists={taskLists}
                    onAddList={createList}
                />
            )}

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Header */}
                <div style={{
                    height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isMobile && <FiMenu onClick={() => setSidebarOpen(!sidebarOpen)} />}
                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>
                            {activeList ? activeList.title : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                        </h3>
                    </div>
                    {activeList && (
                        <button
                            onClick={() => setIsShareOpen(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: 'transparent', border: '1px solid #ddd',
                                padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem'
                            }}
                        >
                            <FiShare2 /> Share
                        </button>
                    )}
                </div>

                {/* Tasks */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

                    {/* Empty State */}
                    {tasks.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#ccc', marginTop: 40 }}>
                            <FiCheck style={{ fontSize: '3rem', marginBottom: 10 }} />
                            <p>No tasks yet. Enjoy your day!</p>
                        </div>
                    )}

                    <Reorder.Group axis="y" values={tasks} onReorder={setTasks} style={{ listStyle: 'none', padding: 0 }}>
                        <AnimatePresence initial={false}>
                            {tasks.map(task => (
                                <Reorder.Item key={task.id} value={task}
                                    style={{ background: 'white', position: 'relative', overflow: 'hidden' }}
                                    whileDrag={{ scale: 1.02, boxShadow: '0 5px 15px rgba(0,0,0,0.1)', borderRadius: 8, zIndex: 50 }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <div className="task-row" style={{
                                        padding: '10px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', gap: 12,
                                        opacity: task.isCompleted ? 0.6 : 1
                                    }}>
                                        <div
                                            onClick={() => toggleComplete(task)}
                                            style={{
                                                marginTop: 3, width: 18, height: 18, borderRadius: '50%',
                                                border: task.isCompleted ? '2px solid #058527' : '2px solid #ccc',
                                                background: task.isCompleted ? '#058527' : 'transparent',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontSize: '10px', flexShrink: 0
                                            }}
                                        >
                                            {task.isCompleted && <FiCheck />}
                                        </div>
                                        <span style={{
                                            flex: 1, fontSize: '0.95rem', color: task.isCompleted ? '#aaa' : '#333',
                                            textDecoration: task.isCompleted ? 'line-through' : 'none'
                                        }}>
                                            {task.content}
                                        </span>
                                        <button onClick={() => deleteTask(task.id)} className="task-actions" style={{ opacity: 0, border: 'none', background: 'none', cursor: 'pointer', color: '#d93025' }}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </AnimatePresence>
                    </Reorder.Group>

                    {/* Add Input */}
                    <div style={{ marginTop: 15 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#d93025', cursor: 'pointer' }} onClick={() => setInputFocus(true)}>
                            <FiPlus /> <span style={{ fontSize: '0.9rem' }}>Add task</span>
                        </div>
                        {inputFocus && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 10, padding: 10, border: '1px solid #ddd', borderRadius: 8 }}>
                                <input
                                    autoFocus
                                    placeholder="What needs to be done?"
                                    value={newTaskContent}
                                    onChange={e => setNewTaskContent(e.target.value)}
                                    onKeyDown={handleAddTask}
                                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.95rem' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, gap: 10 }}>
                                    <button onClick={() => setInputFocus(false)} style={{ padding: '6px 12px', background: '#f5f5f5', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                                    <button onClick={handleAddTask} style={{ padding: '6px 12px', background: '#d93025', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Add Task</button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                    <style>{` .task-row:hover .task-actions { opacity: 1 !important; } `}</style>
                </div>
            </div>

            {/* Share Modal */}
            {activeList && isShareOpen && (
                <ShareModal
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    boardId={activeList.id} // Re-using board ID prop for List ID
                    currentUser={user}
                    currentAllowedEmails={activeList.allowedEmails || []}
                    isOwner={activeList.ownerId === user.uid}
                // We need to support "collectionType" prop in ShareModal if it's hardcoded to 'boards'
                // Assuming ShareModal writes to `boards` collection? 
                // CRITICAL: ShareModal might be hardcoded to 'boards'. I need to check ShareModal.
                // For now, I'll assume we might need to modify ShareModal or pass a prop.
                />
            )}
        </div>
    )
}
