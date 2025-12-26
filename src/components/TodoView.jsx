import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FiCheck, FiPlus, FiCalendar, FiClock, FiTag, FiTrash2, FiMoreHorizontal,
    FiCheckCircle, FiCircle, FiX, FiInbox, FiSun, FiCalendar as FiUpcoming,
    FiFlag, FiMenu, FiChevronRight, FiChevronDown, FiUserPlus, FiUsers
} from 'react-icons/fi'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp, setDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { useSettings } from '../App'

// Calendar Imports
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

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
    const [activeView, setActiveView] = useState('inbox') // inbox, today, upcoming, calendar
    const [newTodo, setNewTodo] = useState('')
    const [newTodoDate, setNewTodoDate] = useState('')
    const [newTodoPriority, setNewTodoPriority] = useState(4) // 4 = normal
    const [isAIProcessing, setIsAIProcessing] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const { t, theme } = useSettings()

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
            if (activeView === 'calendar') return true // Calendar handles its own filtering
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

    const shareTodo = async (todo) => {
        const email = prompt("Enter email to share this task with:")
        if (email && email.includes('@')) {
            try {
                await updateDoc(doc(db, 'todos', todo.id), {
                    members: arrayUnion(email)
                })
                alert(`Shared with ${email}`)
            } catch (e) {
                console.error(e)
                alert("Error sharing task")
            }
        }
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
                    Act as a Project Manager using Kanban methodology.
                    Organize these tasks into a structured project board.
                    
                    Tasks:
                    ${taskList}
                    
                    Goal: Group tasks into logical Columns (e.g., "To Do", "In Progress", "Backlog", or by Topic).
                    Sort them by Priority (P1 highest) within columns.
                    
                    Return validated JSON strictly matching this structure:
                    {
                        "title": "Smart Project Board",
                        "columns": [
                            {
                                "title": "Column Name",
                                "color": "#e0e0e0", 
                                "tasks": [
                                    { "content": "Task Content", "priority": 1 }
                                ]
                            }
                        ]
                    }
                `

            const result = await model.generateContent(prompt)
            const text = (await result.response).text()
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
            const data = JSON.parse(jsonStr)

            // --- Programmatic Layout Calculation ---
            // Instead of trusting AI for geometry, we build the layout ourselves.
            const nodes = []

            // Generate UUID helper
            const uuid = () => crypto.randomUUID()

            const COL_WIDTH = 300
            const COL_GAP = 50
            const START_X = 100
            const START_Y = 100

            // Priority Colors
            const P_COLORS = { 1: '#ffcdf3', 2: '#ffe7b3', 3: '#d4e5ff', 4: '#f0f0f0' }

                ; (data.columns || []).forEach((col, colIdx) => {
                    const colX = START_X + colIdx * (COL_WIDTH + COL_GAP)
                    let currentY = START_Y

                    // 1. Create Column Header Node
                    nodes.push({
                        id: uuid(),
                        type: 'note', // Using Note as header for visual consistency
                        content: `### ${col.title}`,
                        x: colX,
                        y: currentY - 60,
                        width: COL_WIDTH,
                        height: 50,
                        color: '#ffffff', // White header
                        fontSize: 20,
                        textAlign: 'center',
                        locked: true // Optional concept
                    })

                        // 2. Create Task Nodes
                        ; (col.tasks || []).forEach((task) => {
                            nodes.push({
                                id: uuid(),
                                type: 'note',
                                content: task.content,
                                x: colX,
                                y: currentY,
                                width: COL_WIDTH,
                                height: 150, // Standard height
                                color: P_COLORS[task.priority] || '#fff9c4', // Fallback yellow
                                fontSize: 14
                            })
                            currentY += 170 // Height + Gap
                        })
                })

            const boardRef = await addDoc(collection(db, 'boards'), {
                title: data.title || "AI Kanban Board",
                createdBy: user.uid,
                ownerId: user.uid,
                ownerEmail: user.email,
                createdAt: new Date().toISOString(),
                allowedEmails: [user.email],
                members: [user.uid],
                elements: [],
                folder: 'AI Generated'
            })

            const batchPromises = nodes.map(node =>
                setDoc(doc(db, `boards/${boardRef.id}/nodes`, node.id), {
                    ...node,
                    createdBy: user.uid,
                    createdAt: serverTimestamp()
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

    // Calendar Events Mapper
    const calendarEvents = todos.filter(t => t.dueDate).map(t => ({
        id: t.id,
        title: t.text,
        start: new Date(t.dueDate),
        end: new Date(t.dueDate),
        allDay: true,
        resource: t
    }))

    const eventStyleGetter = (event) => {
        const priorityColors = {
            1: '#d1453b', // Red
            2: '#eb8909', // Orange
            3: '#246fe0', // Blue
            4: '#808080'  // Grey
        }
        const color = priorityColors[event.resource.priority] || '#808080'
        return {
            style: {
                backgroundColor: color,
                borderRadius: '6px',
                opacity: 0.9,
                color: 'white',
                border: 'none',
                display: 'block',
                fontSize: '0.85rem',
                padding: '2px 6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
        }
    }

    const CalendarComponent = () => (
        <div style={{ height: '100%', padding: '0 20px 20px' }}>
            <style>{`
                .rbc-calendar { font-family: 'Inter', sans-serif; color: ${theme.text}; }
                
                /* Toolbar */
                .rbc-toolbar { margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
                .rbc-toolbar-label { font-size: 1.2rem; font-weight: 700; color: ${theme.textPrim}; }
                .rbc-btn-group { box-shadow: none; border: 1px solid ${theme.border}; border-radius: 8px; overflow: hidden; }
                .rbc-btn-group button { border: none; background: ${theme.bg}; color: ${theme.text}; cursor: pointer; padding: 6px 12px; font-weight: 500; transition: 0.2s; }
                .rbc-btn-group button:hover { background: ${theme.activeBg}; }
                .rbc-btn-group button.rbc-active { background: ${theme.activeBg}; color: ${theme.activeText}; font-weight: 700; box-shadow: none; }
                
                /* Header */
                .rbc-header { padding: 12px 0; font-weight: 600; font-size: 0.85rem; color: ${theme.text}; border-bottom: 1px solid ${theme.border}; text-transform: uppercase; letter-spacing: 0.5px; }
                
                /* Grid & Month */
                .rbc-month-view { border: 1px solid ${theme.border}; border-radius: 12px; overflow: hidden; background: ${theme.cardBg}; }
                .rbc-day-bg { border-left: 1px solid ${theme.border}; }
                .rbc-month-row + .rbc-month-row { border-top: 1px solid ${theme.border}; }
                .rbc-off-range-bg { background: ${theme.bg === '#1a1a1a' ? 'rgba(255,255,255,0.03)' : '#f9fafb'}; }
                
                /* Date Cell */
                .rbc-date-cell { padding: 8px; font-size: 0.9rem; font-weight: 500; color: ${theme.text}; opacity: 0.8; }
                .rbc-today { background: ${theme.activeBg}; }
                .rbc-now { color: ${theme.activeText}; font-weight: 700; }

                /* Hide default border mess */
                .rbc-month-row { border: none; }
                .rbc-day-bg + .rbc-day-bg { border-left: 1px solid ${theme.border}; }
            `}</style>
            <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 'calc(100% - 20px)' }}
                views={['month', 'week', 'agenda']}
                eventPropGetter={eventStyleGetter}
                components={{
                    toolbar: (props) => (
                        <div className="rbc-toolbar">
                            <span className="rbc-btn-group">
                                <button type="button" onClick={() => props.onNavigate('PREV')}><FiChevronDown style={{ transform: 'rotate(90deg)' }} /></button>
                                <button type="button" onClick={() => props.onNavigate('TODAY')}>{t('today')}</button>
                                <button type="button" onClick={() => props.onNavigate('NEXT')}><FiChevronRight /></button>
                            </span>
                            <span className="rbc-toolbar-label">{props.label}</span>
                            <span className="rbc-btn-group">
                                {props.views.map(view => (
                                    <button key={view} type="button" className={props.view === view ? 'rbc-active' : ''} onClick={() => props.onView(view)}>
                                        {view.charAt(0).toUpperCase() + view.slice(1)}
                                    </button>
                                ))}
                            </span>
                        </div>
                    )
                }}
                onSelectEvent={event => alert(`Task: ${event.title}\nDue: ${moment(event.start).format('YYYY-MM-DD')}\nPriority: P${event.resource.priority}`)}
            />
        </div>
    )

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
                        width: '100%', maxWidth: 700,
                        background: theme.modalBg, borderLeft: `1px solid ${theme.border}`,
                        boxShadow: '0 0 30px rgba(0,0,0,0.1)',
                        zIndex: 900, display: 'flex', flexDirection: isMobile ? 'column' : 'row', color: theme.text
                    }}
                >
                    {/* --- Sidebar (Navigation) --- */}
                    <div style={{
                        width: isMobile ? '100%' : 200, background: theme.sidebar,
                        borderRight: isMobile ? 'none' : `1px solid ${theme.border}`,
                        borderBottom: isMobile ? `1px solid ${theme.border}` : 'none',
                        padding: isMobile ? '10px' : '20px 0',
                        display: 'flex', flexDirection: isMobile ? 'row' : 'column',
                        overflowX: isMobile ? 'auto' : 'visible', gap: isMobile ? 10 : 0
                    }}>
                        {!isMobile && (
                            <div style={{ padding: '0 20px 20px', fontWeight: 'bold', fontSize: '1.1rem', color: '#db4c3f', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FiCheckCircle /> IdeaBomb
                            </div>
                        )}

                        <div
                            onClick={() => setActiveView('inbox')}
                            style={{ padding: '8px 20px', cursor: 'pointer', background: activeView === 'inbox' ? theme.activeBg : 'transparent', fontWeight: activeView === 'inbox' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: 10, color: activeView === 'inbox' ? theme.activeText : theme.text, whiteSpace: 'nowrap', borderRadius: isMobile ? 20 : 0 }}
                        >
                            <FiInbox color="#246fe0" /> {t('inbox')}
                            {!isMobile && <span style={{ marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.7 }}>{todos.length}</span>}
                        </div>
                        <div
                            onClick={() => setActiveView('today')}
                            style={{ padding: '8px 20px', cursor: 'pointer', background: activeView === 'today' ? theme.activeBg : 'transparent', fontWeight: activeView === 'today' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: 10, color: activeView === 'today' ? theme.activeText : theme.text, whiteSpace: 'nowrap', borderRadius: isMobile ? 20 : 0 }}
                        >
                            <FiSun color="#058527" /> {t('today')}
                        </div>
                        <div
                            onClick={() => setActiveView('upcoming')}
                            style={{ padding: '8px 20px', cursor: 'pointer', background: activeView === 'upcoming' ? theme.activeBg : 'transparent', fontWeight: activeView === 'upcoming' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: 10, color: activeView === 'upcoming' ? theme.activeText : theme.text, whiteSpace: 'nowrap', borderRadius: isMobile ? 20 : 0 }}
                        >
                            <FiUpcoming color="#692fc2" /> {t('upcoming')}
                        </div>
                        <div
                            onClick={() => setActiveView('calendar')}
                            style={{ padding: '8px 20px', cursor: 'pointer', background: activeView === 'calendar' ? theme.activeBg : 'transparent', fontWeight: activeView === 'calendar' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: 10, color: activeView === 'calendar' ? theme.activeText : theme.text, whiteSpace: 'nowrap', borderRadius: isMobile ? 20 : 0 }}
                        >
                            <FiCalendar color="#e58e26" /> {t('calendar') || "Calendar"}
                        </div>

                        {!isMobile && (
                            <div style={{ marginTop: 'auto', padding: 20 }}>
                                <button
                                    onClick={convertToWhiteboard}
                                    disabled={isAIProcessing}
                                    style={{
                                        width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                                        background: theme.activeBg, color: theme.activeText, fontSize: '0.8rem',
                                        cursor: 'pointer', fontWeight: 600
                                    }}
                                >
                                    {isAIProcessing ? `${t('loading')}` : '✨ To Whiteboard'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* --- Main Content --- */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

                        {/* Header */}
                        <div style={{ padding: '15px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: theme.textPrim }}>
                                {activeView === 'inbox' && t('inbox')}
                                {activeView === 'today' && t('today')}
                                {activeView === 'upcoming' && t('upcoming')}
                                {activeView === 'calendar' && (t('calendar') || "Calendar")}
                            </h2>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, color: theme.text }}><FiX size={20} /></button>
                        </div>

                        {/* Content Area */}
                        {activeView === 'calendar' ? (
                            <CalendarComponent />
                        ) : (
                            /* Task List */
                            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

                                {filteredTodos.length === 0 ? (
                                    <div style={{ textAlign: 'center', marginTop: 50, color: theme.text, opacity: 0.5 }}>
                                        {t('noTasks')}
                                    </div>
                                ) : filteredTodos.map(todo => (
                                    <div
                                        key={todo.id}
                                        style={{
                                            display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 15, position: 'relative',
                                            padding: '10px 0', borderBottom: `1px solid ${theme.border}`
                                        }}
                                    >
                                        <div
                                            onClick={() => toggleComplete(todo)}
                                            style={{
                                                cursor: 'pointer', marginTop: 3,
                                                width: 18, height: 18, borderRadius: '50%',
                                                border: `2px solid ${todo.priority === 1 ? '#d1453b' : todo.priority === 2 ? '#eb8909' : todo.priority === 3 ? '#246fe0' : theme.text}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: todo.completed ? theme.text : 'transparent'
                                            }}
                                        >
                                            {todo.completed && <FiCheck size={12} color={theme.bg} />}
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                textDecoration: todo.completed ? 'line-through' : 'none',
                                                color: todo.completed ? theme.text : theme.textPrim,
                                                fontSize: '0.95rem', lineHeight: '1.5', opacity: todo.completed ? 0.6 : 1
                                            }}>
                                                {todo.text}
                                            </div>
                                            {todo.dueDate && (
                                                <div style={{ fontSize: '0.75rem', color: '#d1453b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <FiCalendar size={10} /> {todo.dueDate}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: 5, opacity: 0.5 }}>
                                            <button onClick={() => shareTodo(todo)} title="Share Task" style={{ border: 'none', background: 'none', cursor: 'pointer', color: theme.text }}>
                                                <FiUserPlus size={14} />
                                            </button>
                                            <div style={{ fontSize: '0.7rem', color: theme.text, marginTop: 5 }}>P{todo.priority || 4}</div>
                                            <button onClick={() => deleteTodo(todo.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: theme.text }}>
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                        {todo.members && todo.members.length > 1 && (
                                            <div style={{ position: 'absolute', bottom: 5, right: 80, fontSize: '0.65rem', color: theme.activeText, display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <FiUsers /> {todo.members.length}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <form onSubmit={handleAdd} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 10 }}>
                                    <input
                                        value={newTodo}
                                        onChange={e => setNewTodo(e.target.value)}
                                        placeholder={t('addTask') + "..."}
                                        style={{
                                            border: 'none', outline: 'none', fontSize: '1rem', fontWeight: 500,
                                            background: 'transparent', color: theme.textPrim
                                        }}
                                        autoFocus
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <input
                                                    type="date"
                                                    value={newTodoDate}
                                                    onChange={e => setNewTodoDate(e.target.value)}
                                                    style={{
                                                        border: `1px solid ${theme.border}`, borderRadius: 4, padding: '4px 8px',
                                                        fontSize: '0.8rem', color: theme.text, outline: 'none',
                                                        fontFamily: 'inherit', background: theme.inputBg || 'transparent'
                                                    }}
                                                />
                                                <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
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
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!newTodo}
                                            style={{
                                                background: newTodo ? '#db4c3f' : theme.activeBg,
                                                color: newTodo ? 'white' : theme.activeText,
                                                border: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 'bold', cursor: newTodo ? 'pointer' : 'default'
                                            }}
                                        >
                                            {t('addTask')}
                                        </button>
                                    </div>
                                </form>

                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
