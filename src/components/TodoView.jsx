import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FiCheck, FiPlus, FiCalendar, FiClock, FiTag, FiTrash2, FiMoreHorizontal,
    FiCheckCircle, FiCircle, FiX, FiInbox, FiSun, FiCalendar as FiUpcoming,
    FiFlag, FiMenu, FiChevronRight, FiChevronDown, FiUserPlus, FiUsers
} from 'react-icons/fi'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp, setDoc, arrayUnion, getDocs } from 'firebase/firestore'
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
    const [activeView, setActiveView] = useState('inbox') // inbox, today, upcoming, calendar, invites
    const [newTodo, setNewTodo] = useState('')
    const [newTodoDate, setNewTodoDate] = useState('')
    const [newTodoPriority, setNewTodoPriority] = useState(4) // 4 = normal
    const [isAIProcessing, setIsAIProcessing] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const { t, theme } = useSettings()

    // Invite Modal State
    const [inviteModal, setInviteModal] = useState(null) // { todoId, todoTitle }
    const [inviteEmail, setInviteEmail] = useState('')
    const [pendingInvites, setPendingInvites] = useState([])

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

    // --- Pending Invites Sync ---
    useEffect(() => {
        if (!user) return
        const q = query(
            collection(db, 'todo_invites'),
            where('toEmail', '==', user.email),
            where('status', '==', 'pending')
        )
        const unsub = onSnapshot(q, (snap) => {
            setPendingInvites(snap.docs.map(d => ({ id: d.id, ...d.data() })))
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

    const shareTodo = (todo) => {
        // Open custom modal instead of prompt()
        setInviteModal({ todoId: todo.id, todoTitle: todo.text })
        setInviteEmail('')
    }

    const sendInvite = async () => {
        if (!inviteEmail || !inviteEmail.includes('@') || !inviteModal) return
        try {
            await addDoc(collection(db, 'todo_invites'), {
                fromUid: user.uid,
                fromName: user.displayName || user.email,
                toEmail: inviteEmail.toLowerCase().trim(),
                todoId: inviteModal.todoId,
                todoTitle: inviteModal.todoTitle,
                status: 'pending',
                createdAt: serverTimestamp()
            })
            setInviteModal(null)
            setInviteEmail('')
        } catch (e) {
            console.error(e)
            alert('Error sending invite')
        }
    }

    const acceptInvite = async (invite) => {
        try {
            // Add user to todo members
            await updateDoc(doc(db, 'todos', invite.todoId), {
                members: arrayUnion(user.email)
            })
            // Delete invite
            await deleteDoc(doc(db, 'todo_invites', invite.id))
        } catch (e) {
            console.error(e)
            alert('Error accepting invite')
        }
    }

    const declineInvite = async (invite) => {
        try {
            await deleteDoc(doc(db, 'todo_invites', invite.id))
        } catch (e) {
            console.error(e)
        }
    }

    // --- AI Conversion State ---
    const [exportModal, setExportModal] = useState(null) // { boards: [], folders: [] }
    const [exportTarget, setExportTarget] = useState('new') // 'new' | boardId
    const [exportFolder, setExportFolder] = useState('')

    // --- Open Export Modal ---
    const openExportModal = async () => {
        if (todos.length === 0) return alert("No tasks to convert!")

        // Fetch user's boards for selection
        try {
            const q = query(
                collection(db, 'boards'),
                where('allowedEmails', 'array-contains', user.email)
            )
            const snap = await getDocs(q)
            const boards = snap.docs.map(d => ({ id: d.id, title: d.data().title, folder: d.data().folder }))
            const folders = [...new Set(boards.map(b => b.folder).filter(Boolean))]

            setExportModal({ boards, folders })
            setExportTarget('new')
            setExportFolder('')
        } catch (e) {
            console.error(e)
            alert('Error loading boards')
        }
    }

    // --- AI Conversion ---
    const convertToWhiteboard = async () => {
        setIsAIProcessing(true)
        setExportModal(null)

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY
            if (!apiKey) throw new Error("API Key missing")

            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash-lite" })

            // Enhanced task list with more context
            const taskList = todos.map(t => {
                let line = `- [Priority ${t.priority || 4}] "${t.text}"`
                if (t.dueDate) line += ` (Due: ${t.dueDate})`
                if (t.completed) line += ` [COMPLETED]`
                if (t.members && t.members.length > 1) line += ` [Shared with ${t.members.length} people]`
                return line
            }).join('\n')

            const prompt = `
You are a professional project manager and visual thinking expert.
Analyze the following task list and create a comprehensive, actionable project board.

## User's Tasks:
${taskList}

## Your Mission:
1. **Analyze** - Identify themes, dependencies, and logical groupings
2. **Categorize** - Group tasks into meaningful columns (don't just use generic "To Do/In Progress/Done")
3. **Enhance** - For each task, add:
   - A clearer, action-oriented title
   - Brief context or next steps (1-2 sentences)
   - Suggested timeline if missing
4. **Visualize** - Suggest connections between related tasks

## Output Requirements:
Return ONLY valid JSON matching this exact structure:
{
    "title": "Descriptive Board Title Based on Content",
    "insights": "Brief 1-2 sentence summary of what this project is about",
    "columns": [
        {
            "title": "Column Name",
            "color": "#hex_color",
            "tasks": [
                {
                    "content": "Enhanced task description with context",
                    "priority": 1,
                    "originalTask": "Original task text for reference"
                }
            ]
        }
    ]
}

Use these colors: #ffcdf3 (urgent), #ffe7b3 (important), #d4e5ff (normal), #e8f5e9 (low/done)
`

            const result = await model.generateContent(prompt)
            const text = (await result.response).text()
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
            const data = JSON.parse(jsonStr)

            // --- Programmatic Layout Calculation ---
            const nodes = []
            const uuid = () => crypto.randomUUID()

            const COL_WIDTH = 300
            const COL_GAP = 50
            const START_X = 100
            const START_Y = 100

            const P_COLORS = { 1: '#ffcdf3', 2: '#ffe7b3', 3: '#d4e5ff', 4: '#f0f0f0' }

                ; (data.columns || []).forEach((col, colIdx) => {
                    const colX = START_X + colIdx * (COL_WIDTH + COL_GAP)
                    let currentY = START_Y

                    // Column Header
                    nodes.push({
                        id: uuid(),
                        type: 'note',
                        content: `### ${col.title}`,
                        x: colX,
                        y: currentY - 60,
                        width: COL_WIDTH,
                        height: 50,
                        color: col.color || '#ffffff',
                        fontSize: 18,
                        textAlign: 'center',
                        locked: true
                    })

                        // Tasks
                        ; (col.tasks || []).forEach((task) => {
                            nodes.push({
                                id: uuid(),
                                type: 'note',
                                content: task.content,
                                x: colX,
                                y: currentY,
                                width: COL_WIDTH,
                                height: 150,
                                color: P_COLORS[task.priority] || col.color || '#fff9c4',
                                fontSize: 14
                            })
                            currentY += 170
                        })
                })

            let targetBoardId

            if (exportTarget === 'new') {
                // Create new board
                const boardRef = await addDoc(collection(db, 'boards'), {
                    title: data.title || "AI Kanban Board",
                    createdBy: user.uid,
                    ownerId: user.uid,
                    ownerEmail: user.email,
                    createdAt: new Date().toISOString(),
                    allowedEmails: [user.email],
                    members: [user.uid],
                    elements: [],
                    folder: exportFolder || 'AI Generated'
                })
                targetBoardId = boardRef.id
            } else {
                // Use existing board
                targetBoardId = exportTarget
            }

            // Add nodes to board
            const batchPromises = nodes.map(node =>
                setDoc(doc(db, `boards/${targetBoardId}/nodes`, node.id), {
                    ...node,
                    createdBy: user.uid,
                    createdAt: serverTimestamp()
                })
            )

            await Promise.all(batchPromises)
            window.location.href = `/board/${targetBoardId}`

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
        <>
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
                            <div
                                onClick={() => setActiveView('invites')}
                                style={{ padding: '8px 20px', cursor: 'pointer', background: activeView === 'invites' ? theme.activeBg : 'transparent', fontWeight: activeView === 'invites' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: 10, color: activeView === 'invites' ? theme.activeText : theme.text, whiteSpace: 'nowrap', borderRadius: isMobile ? 20 : 0, position: 'relative' }}
                            >
                                <FiUserPlus color="#9b59b6" /> Invitations
                                {pendingInvites.length > 0 && (
                                    <span style={{ position: 'absolute', top: 4, right: 10, background: '#e74c3c', color: 'white', fontSize: '0.7rem', borderRadius: 10, padding: '1px 6px', fontWeight: 'bold' }}>{pendingInvites.length}</span>
                                )}
                            </div>

                            {!isMobile && (
                                <div style={{ marginTop: 'auto', padding: 20 }}>
                                    <button
                                        onClick={openExportModal}
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
                                    {activeView === 'invites' && 'Invitations'}
                                </h2>
                                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, color: theme.text }}><FiX size={20} /></button>
                            </div>

                            {/* Content Area */}
                            {activeView === 'calendar' ? (
                                <CalendarComponent />
                            ) : activeView === 'invites' ? (
                                /* Invitations List */
                                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                                    {pendingInvites.length === 0 ? (
                                        <div style={{ textAlign: 'center', marginTop: 50, color: theme.text, opacity: 0.5 }}>
                                            No pending invitations.
                                        </div>
                                    ) : pendingInvites.map(invite => (
                                        <motion.div
                                            key={invite.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 15, marginBottom: 15,
                                                padding: 15, background: theme.cardBg, borderRadius: 10, border: `1px solid ${theme.border}`
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: theme.textPrim, marginBottom: 5 }}>{invite.todoTitle}</div>
                                                <div style={{ fontSize: '0.8rem', color: theme.text, opacity: 0.7 }}>From: {invite.fromName}</div>
                                            </div>
                                            <button
                                                onClick={() => acceptInvite(invite)}
                                                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#27ae60', color: 'white', cursor: 'pointer', fontWeight: 500 }}
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => declineInvite(invite)}
                                                style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.text, cursor: 'pointer' }}
                                            >
                                                Decline
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
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

            {/* Invite Modal */}
            <AnimatePresence>
                {inviteModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{ background: theme.cardBg, padding: 25, borderRadius: 16, width: '90%', maxWidth: 400, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
                        >
                            <h3 style={{ margin: '0 0 8px 0', color: theme.textPrim }}>Share Task</h3>
                            <p style={{ margin: '0 0 20px 0', color: theme.text, opacity: 0.7, fontSize: '0.9rem' }}>"{inviteModal.todoTitle}"</p>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                placeholder="Enter email address..."
                                style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: '1rem', marginBottom: 20, background: theme.bg, color: theme.text, outline: 'none' }}
                                autoFocus
                            />
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button onClick={() => setInviteModal(null)} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.text, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={sendInvite} disabled={!inviteEmail.includes('@')} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: inviteEmail.includes('@') ? '#9b59b6' : '#ccc', color: 'white', cursor: inviteEmail.includes('@') ? 'pointer' : 'default', fontWeight: 600 }}>Send Invite</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Export to Whiteboard Modal */}
            <AnimatePresence>
                {exportModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{ background: theme.cardBg, padding: 25, borderRadius: 16, width: '90%', maxWidth: 450, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
                        >
                            <h3 style={{ margin: '0 0 15px 0', color: theme.textPrim, display: 'flex', alignItems: 'center', gap: 10 }}>✨ Export to Whiteboard</h3>
                            <p style={{ margin: '0 0 20px 0', color: theme.text, opacity: 0.7, fontSize: '0.85rem' }}>
                                AI will analyze your {todos.length} tasks and create a visual Kanban board.
                            </p>

                            {/* Destination Selection */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: theme.textPrim }}>Destination</label>
                                <select
                                    value={exportTarget}
                                    onChange={e => setExportTarget(e.target.value)}
                                    style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: '0.95rem', background: theme.bg, color: theme.text, outline: 'none' }}
                                >
                                    <option value="new">➕ Create New Board</option>
                                    {exportModal.boards.map(b => (
                                        <option key={b.id} value={b.id}>📋 {b.title} {b.folder && `(${b.folder})`}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Folder Selection (only for new boards) */}
                            {exportTarget === 'new' && (
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: theme.textPrim }}>Folder</label>
                                    <input
                                        type="text"
                                        value={exportFolder}
                                        onChange={e => setExportFolder(e.target.value)}
                                        placeholder="AI Generated"
                                        list="folder-suggestions"
                                        style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: '0.95rem', background: theme.bg, color: theme.text, outline: 'none' }}
                                    />
                                    <datalist id="folder-suggestions">
                                        {exportModal.folders.map(f => <option key={f} value={f} />)}
                                    </datalist>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button onClick={() => setExportModal(null)} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.text, cursor: 'pointer' }}>Cancel</button>
                                <button
                                    onClick={convertToWhiteboard}
                                    disabled={isAIProcessing}
                                    style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' }}
                                >
                                    {isAIProcessing ? 'Processing...' : '✨ Generate'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
