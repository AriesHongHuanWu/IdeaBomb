import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, AnimatePresence } from 'framer-motion'
import { FiTrash2, FiCalendar, FiCheckSquare, FiImage, FiType, FiPlus, FiX, FiGrid, FiYoutube, FiCopy, FiScissors, FiClipboard, FiArrowRight } from 'react-icons/fi'

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

// --- Draggable Node ---
const DraggableNode = ({ node, isSelected, onSelect, onUpdatePosition, onUpdateData, onDelete }) => {
    const x = useMotionValue(node.x); const y = useMotionValue(node.y);
    const [isHovered, setIsHovered] = useState(false)
    useEffect(() => { x.set(node.x); y.set(node.y) }, [node.x, node.y, x, y])

    const colors = ['#ffffeb', '#e6f7ff', '#fff0f5', '#f0fff0', '#f5f5f5', '#fff8dc', '#e0ffff']

    return (
        <motion.div
            drag dragMomentum={false} dragElastic={0}
            onDragEnd={(e, info) => onUpdatePosition(node.id, info.offset)}
            onClick={(e) => { e.stopPropagation(); onSelect(e) }}
            onContextMenu={(e) => { onSelect(e) }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            style={{ x, y, position: 'absolute', pointerEvents: 'auto', zIndex: isSelected ? 50 : 10 }}
        >
            <div className="glass-panel" style={{
                width: 300, minHeight: 200, padding: 20, borderRadius: 24, display: 'flex', flexDirection: 'column',
                background: node.color || '#fff',
                border: isSelected ? '3px solid var(--primary)' : '1px solid rgba(255,255,255,0.5)',
                boxShadow: isSelected ? '0 10px 40px rgba(26, 115, 232, 0.3)' : '0 10px 30px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
                transition: 'box-shadow 0.2s'
            }}>
                {/* Color Picker (Visible on Hover) */}
                <AnimatePresence>
                    {isHovered && (['Note', 'Todo'].includes(node.type) || !node.type) && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{ position: 'absolute', top: -15, left: 10, display: 'flex', gap: 5, zIndex: 100, background: 'white', padding: 5, borderRadius: 20, boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}
                        >
                            {colors.map(c => (
                                <div key={c} onClick={(e) => { e.stopPropagation(); onUpdateData(node.id, { color: c }) }}
                                    style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: '1px solid #ddd', cursor: 'pointer' }} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Delete Button (Visible on Hover) */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => onDelete(node.id)}
                            style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: '50%', background: '#ff4d4f', color: 'white', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}
                            onPointerDown={e => e.stopPropagation()}
                        >
                            <FiTrash2 size={16} />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Content Switching */}
                {node.type === 'Todo' && <TodoNode node={node} onUpdate={onUpdateData} />}
                {node.type === 'Calendar' && <CalendarNode node={node} onUpdate={onUpdateData} />}
                {node.type === 'Image' && <ImageNode node={node} onUpdate={onUpdateData} />}
                {node.type === 'YouTube' && <YouTubeNode node={node} onUpdate={onUpdateData} />}
                {(!['Todo', 'Calendar', 'Image', 'YouTube'].includes(node.type)) && <NoteNode node={node} onUpdate={onUpdateData} />}
            </div>
        </motion.div>
    )
}

// --- Menu ---
const ContextMenu = ({ x, y, onDelete, onCopy, onMove, pages, visible, onClose }) => {
    if (!visible) return null
    return (
        <div style={{ position: 'fixed', top: y, left: x, background: 'white', borderRadius: 12, boxShadow: '0 5px 30px rgba(0,0,0,0.2)', padding: 5, zIndex: 1000, minWidth: 150 }}>
            <button onClick={onCopy} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}><FiCopy /> Copy</button>
            <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'red' }}><FiTrash2 /> Delete</button>
            <div style={{ padding: '5px 12px', fontSize: '0.8rem', color: '#999', fontWeight: 'bold' }}>Move To...</div>
            {pages.map(p => (
                <button key={p} onClick={() => onMove(p)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', paddingLeft: 20 }}>
                    <FiArrowRight size={12} /> {p}
                </button>
            ))}
            {/* Overlay for closing */}
            <div style={{ position: 'fixed', inset: 0, zIndex: -1 }} onClick={onClose}></div>
        </div>
    )
}

export default function Whiteboard({ nodes, pages, onAddNode, onUpdateNodePosition, onUpdateNodeData, onDeleteNode, onBatchDelete, onCopy, onPaste, onMoveToPage }) {
    const [scale, setScale] = useState(1); const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [selectedIds, setSelectedIds] = useState([])
    const [menu, setMenu] = useState({ x: 0, y: 0, visible: false })
    const containerRef = useRef()
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)

    // Auto Arrange Logic
    const autoArrange = () => {
        const cols = Math.ceil(Math.sqrt(nodes.length))
        nodes.forEach((node, i) => {
            const col = i % cols; const row = Math.floor(i / cols)
            onUpdateNodeData(node.id, { x: 100 + col * 340, y: 100 + row * 340 })
        })
    }

    // Listen for AI Arrange Event
    useEffect(() => {
        const handler = () => autoArrange()
        window.addEventListener('ai-arrange', handler)
        return () => window.removeEventListener('ai-arrange', handler)
    }, [nodes])

    // Selection Logic
    const handleNodeClick = (e, id) => {
        if (e.shiftKey || e.ctrlKey) {
            setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
        } else {
            if (!selectedIds.includes(id)) setSelectedIds([id])
        }
    }
    const handleBgClick = (e) => {
        if (!e.shiftKey && !e.ctrlKey) setSelectedIds([])
        setMenu({ ...menu, visible: false })
    }

    // Context Menu
    const handleContextMenu = (e) => {
        e.preventDefault()
        setMenu({ x: e.clientX, y: e.clientY, visible: true })
    }

    // Canvas Pan/Zoom
    useEffect(() => {
        const c = containerRef.current; if (!c) return
        const w = (e) => { if (e.ctrlKey) { e.preventDefault(); setScale(p => Math.min(Math.max(0.1, p * Math.exp(-e.deltaY * 0.01)), 5)) } else { e.preventDefault(); setOffset(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY })) } }
        c.addEventListener('wheel', w, { passive: false }); return () => c.removeEventListener('wheel', w)
    }, [])

    // Shortcuts
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') { onCopy(selectedIds) }
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') { onPaste() }
            if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedIds.length > 0) onBatchDelete(selectedIds) }
        }
        window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler)
    }, [selectedIds, onCopy, onPaste, onBatchDelete])

    return (
        <div ref={containerRef} onContextMenu={handleContextMenu} onPointerDown={(e) => { if (e.target === containerRef.current) { setIsDraggingCanvas(true); e.target.setPointerCapture(e.pointerId); handleBgClick(e) } }} onPointerMove={(e) => { if (isDraggingCanvas) setOffset(p => ({ x: p.x + e.movementX, y: p.y + e.movementY })) }} onPointerUp={(e) => { setIsDraggingCanvas(false); if (e.target) e.target.releasePointerCapture(e.pointerId) }} style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#f0f2f5', position: 'relative', touchAction: 'none', cursor: isDraggingCanvas ? 'grabbing' : 'grab' }}>
            <div className="grid-bg" style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px)', backgroundSize: '20px 20px', transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0', opacity: 0.5, pointerEvents: 'none' }} />
            <motion.div style={{ width: '100%', height: '100%', x: offset.x, y: offset.y, scale, transformOrigin: '0 0', pointerEvents: 'none' }}>
                {nodes.map(node => (
                    <DraggableNode key={node.id} node={node} isSelected={selectedIds.includes(node.id)} onSelect={(e) => handleNodeClick(e, node.id)} onUpdatePosition={onUpdateNodePosition} onUpdateData={onUpdateNodeData} onDelete={onDeleteNode} />
                ))}
            </motion.div>

            <ContextMenu
                visible={menu.visible} x={menu.x} y={menu.y} pages={pages}
                onClose={() => setMenu({ ...menu, visible: false })}
                onCopy={() => { onCopy(selectedIds); setMenu({ ...menu, visible: false }) }}
                onDelete={() => { onBatchDelete(selectedIds); setMenu({ ...menu, visible: false }) }}
                onMove={(page) => { onMoveToPage(selectedIds, page); setMenu({ ...menu, visible: false }) }}
            />

            <motion.div className="glass-panel" style={{ position: 'absolute', bottom: 30, left: '50%', x: '-50%', padding: '10px 20px', display: 'flex', gap: 15, borderRadius: 50, zIndex: 100, pointerEvents: 'auto' }} initial={{ y: 100 }} animate={{ y: 0 }}>
                <ToolBtn icon={<FiType />} label="Note" onClick={() => onAddNode('Note')} />
                <ToolBtn icon={<FiCheckSquare />} label="Todo" onClick={() => onAddNode('Todo')} />
                <ToolBtn icon={<FiCalendar />} label="Calendar" onClick={() => onAddNode('Calendar')} />
                <ToolBtn icon={<FiImage />} label="Image" onClick={() => onAddNode('Image')} />
                <ToolBtn icon={<FiYoutube />} label="YouTube" onClick={() => onAddNode('YouTube')} />
                <div style={{ width: 1, height: 40, background: '#eee', margin: '0 10px' }}></div>
                <ToolBtn icon={<FiGrid />} label="Auto Arrange" onClick={() => window.dispatchEvent(new CustomEvent('ai-arrange'))} />
            </motion.div>
        </div>
    )
}
const ToolBtn = ({ icon, label, onClick }) => (<motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClick} title={label} style={{ width: 50, height: 50, borderRadius: '50%', border: 'none', background: 'white', color: 'var(--primary)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>{icon}</motion.button>)
