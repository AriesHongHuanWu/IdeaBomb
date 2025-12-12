import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { FiMenu, FiPlus, FiCheck, FiMoreHorizontal, FiCalendar, FiFlag, FiShare2, FiInbox, FiSun, FiTrash2, FiEdit2, FiZap } from 'react-icons/fi'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { db } from '../firebase'
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, orderBy, setDoc } from 'firebase/firestore'
import ShareModal from './ShareModal'

// --- Internal Sidebar Component (Defined outside main component to prevent recreation) ---
function InternalSidebar({ activeView, setActiveView, lists, onAddList, onRenameList, onDeleteList }) {
    const [hoveredList, setHoveredList] = useState(null)
    const [menuOpenId, setMenuOpenId] = useState(null)

    const navItems = [
        { id: 'inbox', label: 'Inbox', icon: 'inbox', color: '#246fe0' },
        { id: 'today', label: 'Today', icon: 'sun', color: '#058527' },
    ]

    const getIcon = (iconName) => {
        if (iconName === 'inbox') return <FiInbox />
        if (iconName === 'sun') return <FiSun />
        return null
    }

    // Filter out Inbox from project list
    const filteredLists = lists.filter(list => list.title !== 'Inbox')

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
                        <span style={{ color: item.color, display: 'flex' }}>{getIcon(item.icon)}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: activeView === item.id ? 600 : 400 }}>{item.label}</span>
                    </motion.div>
                ))}
            </div>

            <div style={{ padding: '0 12px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#888', fontSize: '0.8rem', fontWeight: 700 }}>
                <span>PROJECTS</span>
                <FiPlus style={{ cursor: 'pointer' }} onClick={onAddList} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredLists.map(list => (
                    <div key={list.id} style={{ position: 'relative' }}
                        onMouseEnter={() => setHoveredList(list.id)}
                        onMouseLeave={() => { setHoveredList(null); if (menuOpenId !== list.id) setMenuOpenId(null); }}>
                        <motion.div
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

                            {(hoveredList === list.id || menuOpenId === list.id) && (
                                <div onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === list.id ? null : list.id); }}
                                    style={{ padding: 4, borderRadius: 4, cursor: 'pointer', color: '#666', display: 'flex' }}>
                                    <FiMoreHorizontal />
                                </div>
                            )}
                        </motion.div>

                        {menuOpenId === list.id && (
                            <div style={{
                                position: 'absolute', right: 0, top: 30, background: 'white',
                                border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                borderRadius: 8, zIndex: 100, overflow: 'hidden', minWidth: 120
                            }}>
                                <div onClick={() => { onRenameList(list); setMenuOpenId(null); }} style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#333' }}>
                                    <FiEdit2 size={14} /> Rename
                                </div>
                                <div onClick={() => { onDeleteList(list); setMenuOpenId(null); }} style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#d93025', borderTop: '1px solid #f5f5f5' }}>
                                    <FiTrash2 size={14} /> Delete
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {menuOpenId && <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setMenuOpenId(null)} />}
        </div>
    )
}

export default function TodoView({ user }) {
    const isMobile = useMediaQuery('(max-width: 768px)')

    // All useState hooks at the top, unconditionally
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [activeView, setActiveView] = useState('inbox')
    const [taskLists, setTaskLists] = useState([])
    const [tasks, setTasks] = useState([])
    const [inputFocus, setInputFocus] = useState(false)
    const [newTaskContent, setNewTaskContent] = useState('')
    const [newTaskPriority, setNewTaskPriority] = useState(4)
    const [newTaskDueDate, setNewTaskDueDate] = useState('')
    const [editingTask, setEditingTask] = useState(null)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [isVisualizeLoading, setIsVisualizeLoading] = useState(false)
    const [modalConfig, setModalConfig] = useState(null)
    const [modalInput, setModalInput] = useState('')

    // --- Handlers (wrapped in useCallback to prevent recreation) ---
    const openCreateModal = useCallback(() => {
        setModalConfig({ type: 'create', title: 'Start a new project', initialValue: '' })
        setModalInput('')
    }, [])

    const openRenameModal = useCallback((list) => {
        setModalConfig({ type: 'rename', title: 'Rename project', initialValue: list.title, listId: list.id })
        setModalInput(list.title)
    }, [])

    const openDeleteModal = useCallback((list) => {
        setModalConfig({ type: 'delete', title: 'Delete project?', listId: list.id, message: `Are you sure you want to delete "${list.title}"? This cannot be undone.` })
    }, [])

    const handleModalSubmit = useCallback(async () => {
        if (!modalConfig) return
        const { type, listId } = modalConfig

        try {
            if (type === 'create') {
                if (!modalInput.trim()) return
                const ref = await addDoc(collection(db, 'task_lists'), {
                    title: modalInput,
                    ownerId: user.uid,
                    allowedEmails: [user.email],
                    color: '#666',
                    createdAt: serverTimestamp()
                })
                setActiveView(ref.id)
            } else if (type === 'rename') {
                if (!modalInput.trim()) return
                await updateDoc(doc(db, 'task_lists', listId), { title: modalInput })
            } else if (type === 'delete') {
                await deleteDoc(doc(db, 'task_lists', listId))
                if (activeView === listId) setActiveView('inbox')
            }
        } catch (e) {
            console.error(e)
            alert("Error: " + e.message)
        } finally {
            setModalConfig(null)
        }
    }, [modalConfig, modalInput, user, activeView])

    // --- Listen to Task Lists ---
    useEffect(() => {
        if (!user) return

        const q = query(
            collection(db, 'task_lists'),
            where('allowedEmails', 'array-contains', user.email)
        )

        const unsub = onSnapshot(q, (snap) => {
            setTaskLists(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        }, (error) => {
            console.error("Task Lists Query Error:", error)
        })

        return () => unsub()
    }, [user])

    // --- Listen to Tasks ---
    useEffect(() => {
        if (!user) return

        let listIdToQuery = activeView

        // For inbox/today views, find the Inbox list
        if (activeView === 'inbox' || activeView === 'today') {
            const inboxList = taskLists.find(l => l.title === 'Inbox' && l.ownerId === user.uid)
            if (!inboxList) {
                // No inbox yet, just return without setting tasks (initial state is [])
                return
            }
            listIdToQuery = inboxList.id
        }

        const qTasks = query(
            collection(db, 'task_lists', listIdToQuery, 'tasks'),
            orderBy('createdAt', 'asc')
        )

        const unsub = onSnapshot(qTasks, (snap) => {
            setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        }, (error) => {
            console.error("Tasks Query Error:", error)
        })

        return () => unsub()
    }, [user, activeView, taskLists])

    // --- Task Actions ---
    const getTargetListId = useCallback(async () => {
        if (activeView !== 'inbox' && activeView !== 'today') {
            return activeView
        }

        const inbox = taskLists.find(l => l.title === 'Inbox' && l.ownerId === user.uid)
        if (inbox) return inbox.id

        // Auto-create Inbox
        const ref = await addDoc(collection(db, 'task_lists'), {
            title: 'Inbox',
            ownerId: user.uid,
            allowedEmails: [user.email],
            color: '#246fe0',
            createdAt: serverTimestamp()
        })
        return ref.id
    }, [activeView, taskLists, user])

    const handleAddTask = useCallback(async (e) => {
        if ((e.key === 'Enter' || e.type === 'click') && newTaskContent.trim()) {
            try {
                const targetListId = await getTargetListId()
                await addDoc(collection(db, 'task_lists', targetListId, 'tasks'), {
                    content: newTaskContent,
                    isCompleted: false,
                    createdAt: serverTimestamp(),
                    priority: newTaskPriority,
                    dueDate: newTaskDueDate ? new Date(newTaskDueDate) : null,
                    assigneeId: user.uid
                })
                setNewTaskContent('')
                setNewTaskPriority(4)
                setNewTaskDueDate('')
                setInputFocus(false)
            } catch (err) {
                console.error(err)
            }
        }
    }, [newTaskContent, newTaskPriority, newTaskDueDate, user, getTargetListId])

    const toggleComplete = useCallback(async (task) => {
        try {
            const listId = await getTargetListId()
            await updateDoc(doc(db, 'task_lists', listId, 'tasks', task.id), {
                isCompleted: !task.isCompleted
            })
        } catch (err) { console.error(err) }
    }, [getTargetListId])

    const handleUpdateTask = useCallback(async (taskId, newContent) => {
        if (!newContent.trim()) return
        try {
            const listId = await getTargetListId()
            await updateDoc(doc(db, 'task_lists', listId, 'tasks', taskId), { content: newContent })
            setEditingTask(null)
        } catch (err) { console.error(err) }
    }, [getTargetListId])

    const deleteTask = useCallback(async (taskId) => {
        try {
            const listId = await getTargetListId()
            await deleteDoc(doc(db, 'task_lists', listId, 'tasks', taskId))
        } catch (err) { console.error(err) }
    }, [getTargetListId])

    const handleClearCompleted = useCallback(async () => {
        try {
            const listId = await getTargetListId()
            const completed = tasks.filter(t => t.isCompleted)
            await Promise.all(completed.map(t => deleteDoc(doc(db, 'task_lists', listId, 'tasks', t.id))))
        } catch (e) {
            console.error(e)
            alert(e.message)
        }
    }, [tasks, getTargetListId])

    // --- AI Visualization ---
    const handleVisualize = useCallback(async () => {
        if (tasks.length === 0) {
            alert("No tasks to visualize!")
            return
        }
        setIsVisualizeLoading(true)

        try {
            const priorityGroups = {
                1: { label: '🚩 High Priority', color: '#ffebee', items: [] },
                2: { label: '🏳️ Medium Priority', color: '#fff3e0', items: [] },
                3: { label: '🔹 Low Priority', color: '#e3f2fd', items: [] },
                4: { label: '⚪ No Priority', color: '#f5f5f5', items: [] },
            }
            const completedTasks = []

            tasks.forEach(task => {
                if (task.isCompleted) {
                    completedTasks.push(task)
                } else {
                    const p = task.priority || 4
                    priorityGroups[p].items.push(task)
                }
            })

            const activeList = taskLists.find(l => l.id === activeView)
            const boardRef = await addDoc(collection(db, 'boards'), {
                title: `📋 ${activeList?.title || 'Tasks'} - Visualized`,
                createdBy: user.uid,
                ownerId: user.uid,
                ownerEmail: user.email,
                createdAt: new Date().toISOString(),
                allowedEmails: [user.email],
                members: [user.uid],
                thumbnail: null
            })

            const nodePromises = []
            let colIndex = 0
            const colWidth = 280
            const rowHeight = 160
            const startX = 100
            const startY = 100

            for (const [priority, group] of Object.entries(priorityGroups)) {
                if (group.items.length === 0) continue

                const headerId = `header-${priority}-${Date.now()}`
                nodePromises.push(setDoc(doc(db, 'boards', boardRef.id, 'nodes', headerId), {
                    id: headerId,
                    type: 'text',
                    position: { x: startX + colIndex * (colWidth + 40), y: startY - 50 },
                    content: group.label,
                    fontSize: 18,
                    fontWeight: 'bold',
                    createdAt: new Date().toISOString()
                }))

                group.items.forEach((task, taskIndex) => {
                    const nodeId = `task-${task.id}`
                    const dueDateStr = task.dueDate?.toDate ? task.dueDate.toDate().toLocaleDateString() : ''
                    nodePromises.push(setDoc(doc(db, 'boards', boardRef.id, 'nodes', nodeId), {
                        id: nodeId,
                        type: 'sticky',
                        position: { x: startX + colIndex * (colWidth + 40), y: startY + taskIndex * rowHeight },
                        content: `${task.content}${dueDateStr ? `\n📅 ${dueDateStr}` : ''}`,
                        color: group.color,
                        width: colWidth,
                        height: 140,
                        createdAt: new Date().toISOString()
                    }))
                })

                colIndex++
            }

            if (completedTasks.length > 0) {
                const headerId = `header-done-${Date.now()}`
                nodePromises.push(setDoc(doc(db, 'boards', boardRef.id, 'nodes', headerId), {
                    id: headerId,
                    type: 'text',
                    position: { x: startX + colIndex * (colWidth + 40), y: startY - 50 },
                    content: '✅ Completed',
                    fontSize: 18,
                    fontWeight: 'bold',
                    createdAt: new Date().toISOString()
                }))

                completedTasks.forEach((task, taskIndex) => {
                    const nodeId = `task-${task.id}`
                    nodePromises.push(setDoc(doc(db, 'boards', boardRef.id, 'nodes', nodeId), {
                        id: nodeId,
                        type: 'sticky',
                        position: { x: startX + colIndex * (colWidth + 40), y: startY + taskIndex * rowHeight },
                        content: `✓ ${task.content}`,
                        color: '#e8f5e9',
                        width: colWidth,
                        height: 140,
                        createdAt: new Date().toISOString()
                    }))
                })
            }

            await Promise.all(nodePromises)
            window.open(`/board/${boardRef.id}`, '_blank')

        } catch (e) {
            console.error(e)
            alert("Failed to visualize: " + e.message)
        } finally {
            setIsVisualizeLoading(false)
        }
    }, [tasks, taskLists, activeView, user])

    // Derived state (computed, not stored)
    const activeList = taskLists.find(l => l.id === activeView)
    const showSidebar = !isMobile || sidebarOpen

    return (
        <div style={{ display: 'flex', height: '100%', background: 'white', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {/* Internal Sidebar */}
            {showSidebar && (
                <InternalSidebar
                    activeView={activeView}
                    setActiveView={setActiveView}
                    lists={taskLists}
                    onAddList={openCreateModal}
                    onRenameList={openRenameModal}
                    onDeleteList={openDeleteModal}
                />
            )}

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Header */}
                <div style={{
                    height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isMobile && <FiMenu onClick={() => setSidebarOpen(!sidebarOpen)} style={{ cursor: 'pointer' }} />}
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333', fontWeight: 600 }}>
                            {activeList ? activeList.title : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                        </h3>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleVisualize}
                            disabled={isVisualizeLoading || tasks.length === 0}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white', border: 'none',
                                padding: '8px 14px', borderRadius: 20, cursor: tasks.length === 0 ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 4px 15px rgba(118, 75, 162, 0.3)',
                                opacity: tasks.length === 0 ? 0.5 : 1
                            }}
                        >
                            <FiZap /> {isVisualizeLoading ? 'Creating...' : 'AI Board'}
                        </motion.button>
                        {activeList && (
                            <button
                                onClick={() => setIsShareOpen(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    background: 'transparent', border: '1px solid #ddd',
                                    padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem'
                                }}
                            >
                                <FiShare2 /> Share
                            </button>
                        )}
                        {tasks.some(t => t.isCompleted) && (
                            <button onClick={handleClearCompleted} style={{ fontSize: '0.75rem', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                Clear done
                            </button>
                        )}
                    </div>
                </div>

                {/* Tasks */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    {tasks.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#ccc', marginTop: 60 }}>
                            <FiCheck style={{ fontSize: '3rem', marginBottom: 10 }} />
                            <p>No tasks yet. Enjoy your day!</p>
                        </div>
                    )}

                    <Reorder.Group axis="y" values={tasks} onReorder={setTasks} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
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
                                        padding: '12px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', gap: 12,
                                        opacity: task.isCompleted ? 0.5 : 1
                                    }}>
                                        <div
                                            onClick={() => toggleComplete(task)}
                                            style={{
                                                marginTop: 2, width: 20, height: 20, borderRadius: '50%',
                                                border: task.isCompleted ? '2px solid #058527' : '2px solid #ccc',
                                                background: task.isCompleted ? '#058527' : 'transparent',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontSize: '10px', flexShrink: 0
                                            }}
                                        >
                                            {task.isCompleted && <FiCheck />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            {editingTask && editingTask.id === task.id ? (
                                                <input
                                                    autoFocus
                                                    value={editingTask.content}
                                                    onChange={e => setEditingTask({ ...editingTask, content: e.target.value })}
                                                    onBlur={() => handleUpdateTask(task.id, editingTask.content)}
                                                    onKeyDown={e => e.key === 'Enter' && handleUpdateTask(task.id, editingTask.content)}
                                                    style={{ width: '100%', fontSize: '0.95rem', padding: '4px 8px', border: '1px solid #1a73e8', borderRadius: 4, outline: 'none' }}
                                                />
                                            ) : (
                                                <div onClick={() => setEditingTask({ id: task.id, content: task.content })} style={{ cursor: 'pointer' }}>
                                                    <div style={{ fontSize: '0.95rem', color: task.isCompleted ? '#aaa' : '#333', textDecoration: task.isCompleted ? 'line-through' : 'none' }}>
                                                        {task.content}
                                                    </div>
                                                    {(task.dueDate || (task.priority && task.priority !== 4)) && (
                                                        <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: '0.75rem', color: '#888' }}>
                                                            {task.dueDate && (
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                                    <FiCalendar size={12} />
                                                                    {task.dueDate.toDate ? task.dueDate.toDate().toLocaleDateString() : new Date(task.dueDate).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                            {task.priority && task.priority !== 4 && (
                                                                <span style={{ color: task.priority === 1 ? '#d93025' : task.priority === 2 ? '#f9a825' : '#1a73e8' }}>
                                                                    <FiFlag size={12} /> P{task.priority}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => deleteTask(task.id)} className="task-actions" style={{ opacity: 0, border: 'none', background: 'none', cursor: 'pointer', color: '#d93025', padding: 4 }}>
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </AnimatePresence>
                    </Reorder.Group>

                    {/* Add Task */}
                    <div style={{ marginTop: 20 }}>
                        {!inputFocus ? (
                            <div onClick={() => setInputFocus(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#d93025', cursor: 'pointer', padding: '8px 0' }}>
                                <FiPlus /> <span style={{ fontSize: '0.9rem' }}>Add task</span>
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 15, border: '1px solid #ddd', borderRadius: 10, background: '#fafafa' }}>
                                <input
                                    autoFocus
                                    placeholder="What needs to be done?"
                                    value={newTaskContent}
                                    onChange={e => setNewTaskContent(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddTask(e)}
                                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '1rem', background: 'transparent', marginBottom: 12 }}
                                />
                                <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                                    <input
                                        type="date"
                                        value={newTaskDueDate}
                                        onChange={e => setNewTaskDueDate(e.target.value)}
                                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.85rem', fontFamily: 'inherit' }}
                                    />
                                    <select
                                        value={newTaskPriority}
                                        onChange={e => setNewTaskPriority(Number(e.target.value))}
                                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.85rem', fontFamily: 'inherit', background: 'white' }}
                                    >
                                        <option value={1}>🚩 P1 (High)</option>
                                        <option value={2}>🏳️ P2 (Medium)</option>
                                        <option value={3}>🔹 P3 (Low)</option>
                                        <option value={4}>⚪ P4 (None)</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                    <button onClick={() => setInputFocus(false)} style={{ padding: '8px 16px', background: '#f5f5f5', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                                    <button onClick={handleAddTask} style={{ padding: '8px 16px', background: '#d93025', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Add Task</button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                    <style>{` .task-row:hover .task-actions { opacity: 1 !important; } `}</style>
                </div>
            </div>

            {/* Project Action Modal */}
            {modalConfig && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        style={{ background: 'white', padding: 25, borderRadius: 16, width: 350, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
                    >
                        <h3 style={{ marginTop: 0, fontSize: '1.2rem' }}>{modalConfig.title}</h3>

                        {modalConfig.type === 'delete' ? (
                            <p style={{ color: '#666', lineHeight: 1.5 }}>{modalConfig.message}</p>
                        ) : (
                            <input
                                autoFocus
                                value={modalInput}
                                onChange={e => setModalInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleModalSubmit()}
                                style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #ddd', fontSize: '1rem', outline: 'none', marginBottom: 20 }}
                            />
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                            <button onClick={() => setModalConfig(null)} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: '#f5f5f5', color: '#666', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                            <button
                                onClick={handleModalSubmit}
                                style={{
                                    padding: '10px 18px', borderRadius: 8, border: 'none',
                                    background: modalConfig.type === 'delete' ? '#d93025' : '#1a73e8',
                                    color: 'white', cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                {modalConfig.type === 'create' ? 'Add project' : modalConfig.type === 'rename' ? 'Save' : 'Delete'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Share Modal */}
            {activeList && isShareOpen && (
                <ShareModal
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    boardId={activeList.id}
                    currentUser={user}
                    currentAllowedEmails={activeList.allowedEmails || []}
                    isOwner={activeList.ownerId === user.uid}
                    collectionName="task_lists"
                />
            )}
        </div>
    )
}
