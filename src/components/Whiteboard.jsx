import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { FiMove, FiTrash2, FiMaximize2, FiCalendar, FiCheckSquare, FiImage, FiType, FiPlus, FiX } from 'react-icons/fi'

// --- Node Components ---

const TodoNode = ({ node, onUpdate }) => {
    const items = node.items || []
    const [newItem, setNewItem] = useState('')

    const toggleItem = (index) => {
        const newItems = [...items]
        newItems[index].done = !newItems[index].done
        onUpdate(node.id, { items: newItems })
    }

    const addItem = (e) => {
        e.preventDefault()
        if (!newItem.trim()) return
        const newItems = [...items, { text: newItem, done: false }]
        onUpdate(node.id, { items: newItems })
        setNewItem('')
    }

    const deleteItem = (index) => {
        const newItems = items.filter((_, i) => i !== index)
        onUpdate(node.id, { items: newItems })
    }

    return (
        <div style={{ width: '100%' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: 5 }}>To-Do List</h3>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => toggleItem(i)}
                            onPointerDown={e => e.stopPropagation()} // Prevent drag start
                        />
                        <span style={{ textDecoration: item.done ? 'line-through' : 'none', flex: 1, color: item.done ? '#aaa' : '#333' }}>{item.text}</span>
                        <button onClick={() => deleteItem(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ccc' }} onPointerDown={e => e.stopPropagation()}><FiX /></button>
                    </div>
                ))}
            </div>
            <form onSubmit={addItem} style={{ display: 'flex', gap: 5, marginTop: 10 }}>
                <input
                    type="text"
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    placeholder="Add task..."
                    style={{ flex: 1, padding: 5, borderRadius: 4, border: '1px solid #ddd' }}
                    onPointerDown={e => e.stopPropagation()}
                />
                <button type="submit" style={{ border: 'none', background: 'var(--primary)', color: 'white', borderRadius: 4, cursor: 'pointer' }} onPointerDown={e => e.stopPropagation()}><FiPlus /></button>
            </form>
        </div>
    )
}

const CalendarNode = ({ node, onUpdate }) => {
    const events = node.events || {} // { "2023-10-01": "Meeting" }
    const [selectedDate, setSelectedDate] = useState(null)
    const [eventText, setEventText] = useState('')

    // Simple Calendar Grid Generation
    const daysInMonth = 30 // Simplified
    const days = Array.from({ length: 30 }, (_, i) => i + 1)

    const handleDateClick = (day) => {
        setSelectedDate(day)
        setEventText(events[day] || '')
    }

    const saveEvent = () => {
        const newEvents = { ...events, [selectedDate]: eventText }
        onUpdate(node.id, { events: newEvents })
        setSelectedDate(null)
    }

    return (
        <div style={{ width: '100%' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: 5 }}>Calendar</h3>
            {!selectedDate ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
                    {days.map(d => (
                        <div
                            key={d}
                            onClick={() => handleDateClick(d)}
                            onPointerDown={e => e.stopPropagation()}
                            style={{
                                padding: 5, textAlign: 'center', borderRadius: 4,
                                background: events[d] ? 'var(--primary-light)' : '#f0f0f0',
                                border: events[d] ? '1px solid var(--primary)' : '1px solid transparent',
                                cursor: 'pointer', fontSize: '0.8rem'
                            }}
                        >
                            {d}
                            {events[d] && <div style={{ width: 4, height: 4, background: 'var(--primary)', borderRadius: '50%', margin: '2px auto' }}></div>}
                        </div>
                    ))}
                </div>
            ) : (
                <div onPointerDown={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <strong>Day {selectedDate}</strong>
                        <button onClick={() => setSelectedDate(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><FiX /></button>
                    </div>
                    <textarea
                        value={eventText}
                        onChange={e => setEventText(e.target.value)}
                        style={{ width: '100%', height: 60, padding: 5, borderRadius: 4, border: '1px solid #ddd', resize: 'none' }}
                        placeholder="Event details..."
                    />
                    <button onClick={saveEvent} style={{ width: '100%', marginTop: 5, background: 'var(--primary)', color: 'white', border: 'none', padding: 5, borderRadius: 4, cursor: 'pointer' }}>Save</button>
                </div>
            )}
        </div>
    )
}

const ImageNode = ({ node, onUpdate }) => {
    const handleUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            onUpdate(node.id, { src: reader.result })
        }
        reader.readAsDataURL(file)
    }

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            {node.src ? (
                <img src={node.src} alt="Upload" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, pointerEvents: 'none' }} />
            ) : (
                <div style={{ border: '2px dashed #ccc', padding: 20, borderRadius: 12, textAlign: 'center', width: '100%' }} onPointerDown={e => e.stopPropagation()}>
                    <FiImage size={24} style={{ color: '#ccc' }} />
                    <p style={{ margin: '10px 0', fontSize: '0.9rem', color: '#666' }}>Upload Image</p>
                    <input type="file" accept="image/*" onChange={handleUpload} style={{ maxWidth: '100%' }} />
                </div>
            )}
        </div>
    )
}

const NoteNode = ({ node, onUpdate }) => (
    <textarea
        defaultValue={node.content}
        onBlur={(e) => onUpdate(node.id, { content: e.target.value })}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
            width: '100%', height: '100%', border: 'none', background: 'transparent',
            resize: 'none', outline: 'none', fontSize: '1rem', fontFamily: 'inherit'
        }}
        placeholder="Type your note here..."
    />
)

// --- Main Draggable Item ---

const DraggableNode = ({ node, onUpdatePosition, onUpdateData }) => {
    const x = useMotionValue(node.x)
    const y = useMotionValue(node.y)

    // Sync external state updates to motion values
    useEffect(() => { x.set(node.x); y.set(node.y) }, [node.x, node.y, x, y])

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={(e, info) => onUpdatePosition(node.id, info.offset)}
            style={{ x, y, position: 'absolute' }}
            className={`node node-${node.type.toLowerCase()}`}
        >
            <div className="glass-panel" style={{
                width: node.type === 'Image' ? 300 : 280,
                minHeight: node.type === 'Calendar' ? 280 : 180,
                background: node.type === 'Note' ? '#ffffeb' : 'rgba(255,255,255,0.9)',
                borderRadius: 24, padding: 20,
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header Logic could go here */}
                <div style={{ flex: 1, display: 'flex' }}>
                    {node.type === 'Todo' && <TodoNode node={node} onUpdate={onUpdateData} />}
                    {node.type === 'Calendar' && <CalendarNode node={node} onUpdate={onUpdateData} />}
                    {node.type === 'Image' && <ImageNode node={node} onUpdate={onUpdateData} />}
                    {(node.type === 'Note' || !['Todo', 'Calendar', 'Image'].includes(node.type)) && <NoteNode node={node} onUpdate={onUpdateData} />}
                </div>
            </div>
        </motion.div>
    )
}

// --- Whiteboard Container ---

export default function Whiteboard({ nodes, onAddNode, onUpdateNodePosition, onUpdateNodeData }) {
    // Zoom/Pan State
    const [scale, setScale] = useState(1)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const containerRef = useRef()

    // Zoom Handler (Wheel)
    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        const handleWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault()
                const s = Math.exp(-e.deltaY * 0.01)
                setScale(prev => Math.min(Math.max(0.1, prev * s), 5))
            } else {
                e.preventDefault()
                setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }))
            }
        }
        container.addEventListener('wheel', handleWheel, { passive: false })
        return () => container.removeEventListener('wheel', handleWheel)
    }, [])

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#f0f2f5', position: 'relative', touchAction: 'none' }}>

            {/* Background Grid */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: '0 0',
                opacity: 0.5
            }} />

            {/* Nodes Layer */}
            <motion.div style={{
                width: '100%', height: '100%',
                x: offset.x, y: offset.y, scale
            }}>
                {nodes.map(node => (
                    <DraggableNode
                        key={node.id}
                        node={node}
                        onUpdatePosition={onUpdateNodePosition}
                        onUpdateData={onUpdateNodeData}
                    />
                ))}
            </motion.div>

            {/* Toolbar */}
            <motion.div
                className="glass-panel"
                style={{
                    position: 'absolute', bottom: 30, left: '50%', x: '-50%',
                    padding: '10px 20px', display: 'flex', gap: 15, borderRadius: 50
                }}
                initial={{ y: 100 }} animate={{ y: 0 }}
            >
                <ToolBtn icon={<FiType />} label="Note" onClick={() => onAddNode('Note')} />
                <ToolBtn icon={<FiCheckSquare />} label="Todo" onClick={() => onAddNode('Todo')} />
                <ToolBtn icon={<FiCalendar />} label="Calendar" onClick={() => onAddNode('Calendar')} />
                <ToolBtn icon={<FiImage />} label="Image" onClick={() => onAddNode('Image')} />
            </motion.div>
        </div>
    )
}

const ToolBtn = ({ icon, label, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={onClick}
        title={label}
        style={{
            width: 50, height: 50, borderRadius: '50%',
            border: 'none', background: 'white', color: 'var(--primary)',
            fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
        }}
    >
        {icon}
    </motion.button>
)
