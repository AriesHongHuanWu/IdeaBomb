import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { FiTrash2, FiCalendar, FiCheckSquare, FiImage, FiType, FiPlus, FiX, FiGrid, FiYoutube } from 'react-icons/fi'

// --- Node Components ---

const YouTubeNode = ({ node, onUpdate }) => {
    const [url, setUrl] = useState('')
    const videoId = node.videoId

    const handleEmbed = () => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        if (match && match[2].length === 11) {
            onUpdate(node.id, { videoId: match[2] })
        } else {
            alert("Invalid YouTube URL")
        }
    }

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 5, color: '#ff0000', display: 'flex', alignItems: 'center', gap: 5 }}>
                <FiYoutube /> YouTube
            </h3>
            {videoId ? (
                <div style={{ flex: 1, width: '100%', borderRadius: 8, overflow: 'hidden', background: 'black', position: 'relative' }}>
                    <iframe
                        width="100%" height="100%"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ pointerEvents: 'auto' }}
                        onPointerDown={e => e.stopPropagation()}
                    />
                    <button
                        onClick={() => onUpdate(node.id, { videoId: null })}
                        style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', zIndex: 10 }}
                    >
                        <FiX size={12} />
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center', flex: 1 }} onPointerDown={e => e.stopPropagation()}>
                    {node.content && node.content.startsWith('Search:') ? (
                        <div style={{ textAlign: 'center' }}>
                            <p>Suggested: {node.content.replace('Search:', '')}</p>
                            <a
                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(node.content.replace('Search:', ''))}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-block', background: '#ff0000', color: 'white', padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 'bold' }}
                            >
                                Open Search Results
                            </a>
                        </div>
                    ) : (
                        <>
                            <input type="text" placeholder="Paste YouTube URL..." value={url} onChange={e => setUrl(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd', width: '100%' }} />
                            <button onClick={handleEmbed} style={{ background: '#ff0000', color: 'white', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer' }}>Embed Video</button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

const TodoNode = ({ node, onUpdate }) => {
    const items = node.items || []
    const [newItem, setNewItem] = useState('')
    const toggleItem = (index) => { const newItems = [...items]; newItems[index].done = !newItems[index].done; onUpdate(node.id, { items: newItems }) }
    const addItem = (e) => { e.preventDefault(); if (!newItem.trim()) return; onUpdate(node.id, { items: [...items, { text: newItem, done: false }] }); setNewItem('') }
    const deleteItem = (index) => { onUpdate(node.id, { items: items.filter((_, i) => i !== index) }) }

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 5, color: 'var(--primary)' }}>To-Do List</h3>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {items.length === 0 && <div style={{ color: '#aaa', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>No tasks yet</div>}
                {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, background: 'rgba(255,255,255,0.5)', padding: '5px 10px', borderRadius: 8 }}>
                        <input type="checkbox" checked={item.done} onChange={() => toggleItem(i)} style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} onPointerDown={e => e.stopPropagation()} />
                        <span style={{ textDecoration: item.done ? 'line-through' : 'none', flex: 1, color: item.done ? '#aaa' : '#333' }}>{item.text}</span>
                        <button onClick={() => deleteItem(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ff6b6b' }} onPointerDown={e => e.stopPropagation()}><FiX /></button>
                    </div>
                ))}
            </div>
            <form onSubmit={addItem} style={{ display: 'flex', gap: 5, marginTop: 10 }}>
                <input type="text" value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add task..." style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #eee', outline: 'none' }} onPointerDown={e => e.stopPropagation()} />
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
    const handleDateClick = (day) => { setSelectedDate(day); setEventText(events[day] || '') }
    const saveEvent = () => { const newEvents = { ...events, [selectedDate]: eventText }; if (!eventText) delete newEvents[selectedDate]; onUpdate(node.id, { events: newEvents }); setSelectedDate(null) }

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 5, color: 'var(--primary)' }}>Calendar</h3>
            {!selectedDate ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <p style={{ fontSize: '0.8rem', color: '#888', margin: '0 0 5px 0', textAlign: 'center' }}>Click a day to add event</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, flex: 1, overflowY: 'auto' }}>
                        {days.map(d => (
                            <div key={d} onClick={() => handleDateClick(d)} onPointerDown={e => e.stopPropagation()}
                                style={{ padding: 2, textAlign: 'center', borderRadius: 4, background: events[d] ? 'var(--primary-light)' : 'rgba(255,255,255,0.5)', border: events[d] ? '1px solid var(--primary)' : '1px solid transparent', cursor: 'pointer', fontSize: '0.8rem', minHeight: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontWeight: events[d] ? 'bold' : 'normal' }}>{d}</span>
                                {events[d] && <div style={{ width: 4, height: 4, background: 'var(--primary)', borderRadius: '50%', margin: '2px auto' }}></div>}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div onPointerDown={e => e.stopPropagation()} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><strong>Day {selectedDate}</strong><button onClick={() => setSelectedDate(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><FiX /></button></div>
                    <textarea value={eventText} onChange={e => setEventText(e.target.value)} style={{ flex: 1, width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ddd', resize: 'none', outline: 'none' }} placeholder="Type event..." autoFocus />
                    <button onClick={saveEvent} style={{ width: '100%', marginTop: 8, background: 'var(--primary)', color: 'white', border: 'none', padding: '8px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Save</button>
                </div>
            )}
        </div>
    )
}

const ImageNode = ({ node, onUpdate }) => {
    const handleUpload = (e) => { const file = e.target.files[0]; if (!file) return; if (file.size > 512000) { alert("Image too large (max 500KB)"); return }; const reader = new FileReader(); reader.onloadend = () => { onUpdate(node.id, { src: reader.result }) }; reader.readAsDataURL(file) }
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            {node.src ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={node.src} alt="Upload" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} />
                    <button onClick={() => onUpdate(node.id, { src: '' })} style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer' }} onPointerDown={e => e.stopPropagation()}><FiX /></button>
                </div>
            ) : (
                <div style={{ border: '2px dashed #ccc', padding: 20, borderRadius: 12, textAlign: 'center', width: '100%' }} onPointerDown={e => e.stopPropagation()}>
                    <FiImage size={24} style={{ color: '#ccc' }} /><p style={{ margin: '10px 0', fontSize: '0.9rem', color: '#666' }}>Click to Upload</p>
                    <input type="file" accept="image/*" onChange={handleUpload} style={{ maxWidth: '100%' }} />
                </div>
            )}
        </div>
    )
}

const NoteNode = ({ node, onUpdate }) => (
    <textarea defaultValue={node.content} onBlur={(e) => onUpdate(node.id, { content: e.target.value })} onPointerDown={(e) => e.stopPropagation()} style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', resize: 'none', outline: 'none', fontSize: '1rem', fontFamily: 'inherit', lineHeight: 1.5, color: '#444' }} placeholder="Type your ideas..." />
)

// --- Main Draggable Item ---
const DraggableNode = ({ node, onUpdatePosition, onUpdateData, onDelete }) => {
    const x = useMotionValue(node.x)
    const y = useMotionValue(node.y)
    const [isHovered, setIsHovered] = useState(false)
    useEffect(() => { x.set(node.x); y.set(node.y) }, [node.x, node.y, x, y])
    const colors = ['#ffffeb', '#e6f7ff', '#fff0f5', '#f0fff0', '#f5f5f5']

    return (
        <motion.div drag dragMomentum={false} dragElastic={0} onDragEnd={(e, info) => onUpdatePosition(node.id, info.offset)} style={{ x, y, position: 'absolute', pointerEvents: 'auto' }} className="node-container">
            <div className="glass-panel" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
                style={{ width: node.type === 'Image' || node.type === 'YouTube' ? 320 : 300, height: node.type === 'Calendar' ? 320 : 250, minHeight: 200, background: node.color || (node.type === 'Note' ? '#ffffeb' : 'rgba(255,255,255,0.95)'), borderRadius: 24, padding: 25, boxShadow: '0 20px 50px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid rgba(255,255,255,0.8)' }}>
                <div style={{ position: 'absolute', top: -12, right: -12, zIndex: 20, opacity: isHovered ? 1 : 0, transform: isHovered ? 'scale(1)' : 'scale(0.8)', transition: 'all 0.2s', pointerEvents: isHovered ? 'auto' : 'none' }}>
                    <button onClick={() => onDelete(node.id)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#ff4d4f', color: 'white', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} onPointerDown={e => e.stopPropagation()}><FiTrash2 size={16} /></button>
                </div>
                {isHovered && ['Note', 'Todo', 'YouTube'].includes(node.type) && (
                    <div style={{ position: 'absolute', top: -10, left: 10, display: 'flex', gap: 5, zIndex: 20 }}>
                        {colors.map(c => (<div key={c} onClick={() => onUpdateData(node.id, { color: c })} onPointerDown={e => e.stopPropagation()} style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: '1px solid #ddd', cursor: 'pointer' }} />))}
                    </div>
                )}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {node.type === 'Todo' && <TodoNode node={node} onUpdate={onUpdateData} />}
                    {node.type === 'Calendar' && <CalendarNode node={node} onUpdate={onUpdateData} />}
                    {node.type === 'Image' && <ImageNode node={node} onUpdate={onUpdateData} />}
                    {node.type === 'YouTube' && <YouTubeNode node={node} onUpdate={onUpdateData} />}
                    {(node.type === 'Note' || !['Todo', 'Calendar', 'Image', 'YouTube'].includes(node.type)) && <NoteNode node={node} onUpdate={onUpdateData} />}
                </div>
            </div>
        </motion.div>
    )
}

// --- Whiteboard Container ---
export default function Whiteboard({ nodes, onAddNode, onUpdateNodePosition, onUpdateNodeData, onDeleteNode }) {
    const [scale, setScale] = useState(1)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const containerRef = useRef()
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        const handleWheel = (e) => { if (e.ctrlKey) { e.preventDefault(); setScale(prev => Math.min(Math.max(0.1, prev * Math.exp(-e.deltaY * 0.01)), 5)) } else { e.preventDefault(); setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY })) } }
        container.addEventListener('wheel', handleWheel, { passive: false })
        return () => container.removeEventListener('wheel', handleWheel)
    }, [])

    const handlePointerDown = (e) => { if (e.target === containerRef.current || e.target.classList.contains('grid-bg')) { setIsDraggingCanvas(true); e.target.setPointerCapture(e.pointerId) } }
    const handlePointerMove = (e) => { if (!isDraggingCanvas) return; setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY })) }
    const handlePointerUp = (e) => { setIsDraggingCanvas(false); if (e.target) e.target.releasePointerCapture(e.pointerId) }

    const autoArrange = () => { const cols = Math.ceil(Math.sqrt(nodes.length)); nodes.forEach((node, i) => { onUpdateNodeData(node.id, { x: 100 + (i % cols) * 350, y: 100 + Math.floor(i / cols) * 350 }) }) }

    useEffect(() => { const handler = () => autoArrange(); window.addEventListener('ai-arrange', handler); return () => window.removeEventListener('ai-arrange', handler) }, [nodes])

    return (
        <div ref={containerRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#f0f2f5', position: 'relative', touchAction: 'none', cursor: isDraggingCanvas ? 'grabbing' : 'grab' }}>
            <div className="grid-bg" style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px)', backgroundSize: '20px 20px', transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0', opacity: 0.5, pointerEvents: 'none' }} />
            <motion.div style={{ width: '100%', height: '100%', x: offset.x, y: offset.y, scale, transformOrigin: '0 0', pointerEvents: 'none' }}>
                {nodes.map(node => (<DraggableNode key={node.id} node={node} onUpdatePosition={onUpdateNodePosition} onUpdateData={onUpdateNodeData} onDelete={onDeleteNode} />))}
            </motion.div>
            <motion.div className="glass-panel" style={{ position: 'absolute', bottom: 30, left: '50%', x: '-50%', padding: '10px 20px', display: 'flex', gap: 15, borderRadius: 50, zIndex: 100, pointerEvents: 'auto' }} initial={{ y: 100 }} animate={{ y: 0 }}>
                <ToolBtn icon={<FiType />} label="Note" onClick={() => onAddNode('Note')} />
                <ToolBtn icon={<FiCheckSquare />} label="Todo" onClick={() => onAddNode('Todo')} />
                <ToolBtn icon={<FiCalendar />} label="Calendar" onClick={() => onAddNode('Calendar')} />
                <ToolBtn icon={<FiImage />} label="Image" onClick={() => onAddNode('Image')} />
                <ToolBtn icon={<FiYoutube />} label="YouTube" onClick={() => onAddNode('YouTube')} />
                <div style={{ width: 1, height: 40, background: '#eee', margin: '0 10px' }}></div>
                <ToolBtn icon={<FiGrid />} label="Auto Arrange" onClick={autoArrange} />
            </motion.div>
        </div>
    )
}

const ToolBtn = ({ icon, label, onClick }) => (<motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClick} title={label} style={{ width: 50, height: 50, borderRadius: '50%', border: 'none', background: 'white', color: 'var(--primary)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>{icon}</motion.button>)
