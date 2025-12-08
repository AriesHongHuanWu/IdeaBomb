import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { FiMove, FiTrash2, FiMaximize2, FiCalendar, FiCheckSquare, FiImage, FiType, FiPlus, FiX, FiGrid } from 'react-icons/fi'

// --- Node Components (Same functionality, improved styles) ---

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
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 5, color: 'var(--primary)' }}>To-Do List</h3>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {items.length === 0 && <div style={{ color: '#aaa', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>No tasks yet</div>}
                {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, background: 'rgba(255,255,255,0.5)', padding: '5px 10px', borderRadius: 8 }}>
                        <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => toggleItem(i)}
                            style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                            onPointerDown={e => e.stopPropagation()}
                        />
                        <span style={{ textDecoration: item.done ? 'line-through' : 'none', flex: 1, color: item.done ? '#aaa' : '#333', fontSize: '0.95rem' }}>{item.text}</span>
                        <button onClick={() => deleteItem(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ff6b6b' }} onPointerDown={e => e.stopPropagation()}><FiX /></button>
                    </div>
                ))}
            </div>
            <form onSubmit={addItem} style={{ display: 'flex', gap: 5, marginTop: 10 }}>
                <input
                    type="text"
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    placeholder="Add task..."
                    style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #eee', outline: 'none', background: 'rgba(255,255,255,0.8)' }}
                    onPointerDown={e => e.stopPropagation()}
                />
                <button type="submit" style={{ border: 'none', background: 'var(--primary)', color: 'white', borderRadius: 8, width: 32, cursor: 'pointer' }} onPointerDown={e => e.stopPropagation()}><FiPlus /></button>
            </form>
        </div>
    )
}

const CalendarNode = ({ node, onUpdate }) => {
    const events = node.events || {}
    const [selectedDate, setSelectedDate] = useState(null)
    const [eventText, setEventText] = useState('')

    const days = Array.from({ length: 30 }, (_, i) => i + 1)

    const handleDateClick = (day) => {
        setSelectedDate(day)
        setEventText(events[day] || '')
    }

    const saveEvent = () => {
        const newEvents = { ...events, [selectedDate]: eventText }
        if (!eventText) delete newEvents[selectedDate] // Delete if empty
        onUpdate(node.id, { events: newEvents })
            < textarea
        value = { eventText }
        onChange = { e => setEventText(e.target.value)}
style = {{ flex: 1, width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ddd', resize: 'none', outline: 'none', fontFamily: 'inherit' }}
placeholder = "Type event here..."
autoFocus
    />
    <button onClick={saveEvent} style={{ width: '100%', marginTop: 8, background: 'var(--primary)', color: 'white', border: 'none', padding: '8px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Save Event</button>
                </div >
            )}
        </div >
    )
}

const ImageNode = ({ node, onUpdate }) => {
    const handleUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 1024 * 500) { // 500KB limit warning for Base64
            alert("Image is too large for this free demo! Please use images under 500KB.")
            return
        }
        const reader = new FileReader()
        reader.onloadend = () => {
            onUpdate(node.id, { src: reader.result })
        }
        reader.readAsDataURL(file)
    }

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            {node.src ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={node.src} alt="Upload" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, pointerEvents: 'none' }} />
                    <button
                        onClick={() => onUpdate(node.id, { src: '' })}
                        style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onPointerDown={e => e.stopPropagation()}
                    >
                        <FiX />
                    </button>
                </div>
            ) : (
                <div style={{ border: '2px dashed #ccc', padding: 20, borderRadius: 12, textAlign: 'center', width: '100%', background: 'rgba(255,255,255,0.5)' }} onPointerDown={e => e.stopPropagation()}>
                    <FiImage size={24} style={{ color: '#ccc' }} />
                    <p style={{ margin: '10px 0', fontSize: '0.9rem', color: '#666' }}>Click to Upload</p>
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
            resize: 'none', outline: 'none', fontSize: '1rem', fontFamily: 'inherit',
            lineHeight: 1.5, color: '#444'
        }}

        export default function Whiteboard({ nodes, onAddNode, onUpdateNodePosition, onUpdateNodeData, onDeleteNode }) {
            const [scale, setScale] = useState(1)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const containerRef = useRef()
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)

    // Zoom (Wheel) & Pan (Wheel)
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

// Pan (Drag)
const handlePointerDown = (e) => {
    // Only pan if clicking on background (not a node/button)
    if (e.target === containerRef.current || e.target.classList.contains('grid-bg')) {
        setIsDraggingCanvas(true)
        e.target.setPointerCapture(e.pointerId)
    }
}

const handlePointerMove = (e) => {
    if (!isDraggingCanvas) return
    setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }))
}

const handlePointerUp = (e) => {
    setIsDraggingCanvas(false)
    if (e.target) e.target.releasePointerCapture(e.pointerId)
}

// Auto Arrange
const autoArrange = () => {
    const cols = Math.ceil(Math.sqrt(nodes.length))
    const gap = 350
    nodes.forEach((node, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)

        const targetX = 100 + col * gap
        const targetY = 100 + row * gap

        onUpdateNodeData(node.id, { x: targetX, y: targetY })
    })
}

return (
    <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#f0f2f5', position: 'relative', touchAction: 'none', cursor: isDraggingCanvas ? 'grabbing' : 'grab' }}
    >

        {/* Background Grid */}
        <div className="grid-bg" style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            opacity: 0.5,
            pointerEvents: 'none'
        }} />

        <motion.div style={{
            width: '100%', height: '100%',
            x: offset.x, y: offset.y, scale,
            transformOrigin: '0 0',
            pointerEvents: 'none' // Nodes have pointerEvents: auto
        }}>
            {nodes.map(node => (
                <DraggableNode
                    key={node.id}
                    node={node}
                    onUpdatePosition={onUpdateNodePosition}
                    onUpdateData={onUpdateNodeData}
                    onDelete={onDeleteNode}
                />
            ))}
        </motion.div>

        <motion.div
            className="glass-panel"
            style={{
                position: 'absolute', bottom: 30, left: '50%', x: '-50%',
                padding: '10px 20px', display: 'flex', gap: 15, borderRadius: 50,
                zIndex: 100, pointerEvents: 'auto'
            }}
            initial={{ y: 100 }} animate={{ y: 0 }}
        >
            <ToolBtn icon={<FiType />} label="Note" onClick={() => onAddNode('Note')} />
            <ToolBtn icon={<FiCheckSquare />} label="Todo" onClick={() => onAddNode('Todo')} />
            <ToolBtn icon={<FiCalendar />} label="Calendar" onClick={() => onAddNode('Calendar')} />
            <ToolBtn icon={<FiImage />} label="Image" onClick={() => onAddNode('Image')} />
            <div style={{ width: 1, height: 40, background: '#eee', margin: '0 10px' }}></div>
            <ToolBtn icon={<FiGrid />} label="Auto Arrange" onClick={autoArrange} />
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
