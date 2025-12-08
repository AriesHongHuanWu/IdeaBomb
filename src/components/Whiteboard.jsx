import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, AnimatePresence } from 'framer-motion'
import { FiTrash2, FiCalendar, FiCheckSquare, FiImage, FiType, FiPlus, FiX, FiGrid, FiYoutube, FiCopy, FiArrowRight } from 'react-icons/fi'

// --- Utilities (Same as before) ---
const useDebounce = (callback, delay) => {
    const timeoutRef = useRef(null)
    return (...args) => { clearTimeout(timeoutRef.current); timeoutRef.current = setTimeout(() => callback(...args), delay) }
}
const Input = (props) => (<input {...props} style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)', outline: 'none', transition: 'all 0.2s', ...props.style }} onFocus={(e) => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)' }} onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.boxShadow = 'none'; if (props.onBlur) props.onBlur(e) }} />)
const Button = ({ children, onClick, variant = 'primary', style }) => { const bg = variant === 'danger' ? 'linear-gradient(135deg, #FF6B6B, #FF8787)' : 'linear-gradient(135deg, #4facfe, #00f2fe)'; return (<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClick} style={{ background: bg, border: 'none', color: 'white', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, boxShadow: '0 4px 10px rgba(0,0,0,0.1)', ...style }}> {children} </motion.button>) }

// --- Node Types (Same as Premium Version) ---
const YouTubeNode = ({ node, onUpdate }) => {
    const [url, setUrl] = useState(''); const videoId = node.videoId
    const handleEmbed = () => { const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/); if (m && m[2].length === 11) { onUpdate(node.id, { videoId: m[2] }) } else alert("Invalid URL") }
    return (<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}> <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#FF0000', fontWeight: 'bold' }}><FiYoutube size={18} /> YouTube Video</div> {videoId ? (<div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', background: 'black', position: 'relative' }}> <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} frameBorder="0" allowFullScreen style={{ pointerEvents: 'auto' }} onPointerDown={e => e.stopPropagation()} /> <button onClick={() => onUpdate(node.id, { videoId: null })} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX /></button> </div>) : (<div onPointerDown={e => e.stopPropagation()} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}> {node.content && node.content.startsWith('Search:') ? (<div style={{ textAlign: 'center' }}> <p style={{ margin: '0 0 10px 0', color: '#666' }}>Suggested: <strong>{node.content.replace('Search:', '')}</strong></p> <Button onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(node.content.replace('Search:', ''))}`, '_blank')}>Open Results</Button> </div>) : (<><Input placeholder="Paste YouTube URL..." value={url} onChange={e => setUrl(e.target.value)} /><Button onClick={handleEmbed}>Embed</Button></>)} </div>)} </div>)
}
const TodoNode = ({ node, onUpdate }) => {
    const items = node.items || []; const [newItem, setNewItem] = useState(''); const toggle = (i) => { const n = [...items]; n[i].done = !n[i].done; onUpdate(node.id, { items: n }) }
    return (<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}> <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: 'var(--primary)', fontWeight: 'bold' }}><FiCheckSquare size={18} /> To-Do List</div> <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}> {items.length === 0 && <div style={{ textAlign: 'center', color: '#ccc', marginTop: 20, fontStyle: 'italic' }}>No tasks yet</div>} {items.map((it, i) => (<motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.6)', padding: '8px 12px', borderRadius: 8 }}> <input type="checkbox" checked={it.done} onChange={() => toggle(i)} onPointerDown={e => e.stopPropagation()} style={{ accentColor: 'var(--primary)', width: 16, height: 16, cursor: 'pointer' }} /> <span style={{ flex: 1, textDecoration: it.done ? 'line-through' : 'none', color: it.done ? '#aaa' : '#333' }}>{it.text}</span> <FiX onClick={() => onUpdate(node.id, { items: items.filter((_, idx) => idx !== i) })} style={{ cursor: 'pointer', color: '#ff6b6b' }} /> </motion.div>))} </div> <form onSubmit={e => { e.preventDefault(); if (newItem) onUpdate(node.id, { items: [...items, { text: newItem, done: false }] }); setNewItem('') }} style={{ display: 'flex', gap: 5, marginTop: 10 }}> <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add new task..." onPointerDown={e => e.stopPropagation()} /> <Button type="submit" style={{ width: 40, padding: 0 }}><FiPlus /></Button> </form> </div>)
}
const CalendarNode = ({ node, onUpdate }) => {
    const events = node.events || {}; const [date, setDate] = useState(''); const [text, setText] = useState(''); const addEvent = () => { if (date && text) { onUpdate(node.id, { events: { ...events, [date]: text } }); setText(''); setDate('') } }; const sortedEvents = Object.entries(events).sort((a, b) => new Date(a[0]) - new Date(b[0]))
    return (<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}> <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#e67e22', fontWeight: 'bold' }}><FiCalendar size={18} /> Calendar</div> <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}> {sortedEvents.length === 0 && <div style={{ textAlign: 'center', color: '#ccc', marginTop: 20 }}>No events scheduled</div>} {sortedEvents.map(([d, t]) => (<div key={d} style={{ background: 'rgba(255,255,255,0.6)', padding: '8px 12px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> <div> <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>{d}</div> <div style={{ fontSize: '0.9rem', color: '#333' }}>{t}</div> </div> <FiX onClick={() => { const n = { ...events }; delete n[d]; onUpdate(node.id, { events: n }) }} style={{ cursor: 'pointer', color: '#ff6b6b' }} onPointerDown={e => e.stopPropagation()} /> </div>))} </div> <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }} onPointerDown={e => e.stopPropagation()}> <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd', width: '100%' }} /> <div style={{ display: 'flex', gap: 5 }}> <Input placeholder="Event name..." value={text} onChange={e => setText(e.target.value)} /> <Button onClick={addEvent} style={{ width: 40, padding: 0 }}><FiPlus /></Button> </div> </div> </div>)
}
const ImageNode = ({ node, onUpdate }) => {
    const up = (e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onloadend = () => onUpdate(node.id, { src: r.result }); r.readAsDataURL(f) } }
    return (<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}> <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#9b59b6', fontWeight: 'bold' }}><FiImage size={18} /> Image</div> <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.03)', borderRadius: 12, overflow: 'hidden', position: 'relative' }}> {node.src ? (<> <img src={node.src} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> <button onClick={() => onUpdate(node.id, { src: '' })} style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer' }} onPointerDown={e => e.stopPropagation()}><FiX /></button> </>) : (<div style={{ textAlign: 'center' }} onPointerDown={e => e.stopPropagation()}> <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Upload Image</p> <input type="file" onChange={up} style={{ maxWidth: 180, marginTop: 10 }} /> </div>)} </div> </div>)
}
const NoteNode = ({ node, onUpdate }) => (<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}> <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, color: '#555', fontWeight: 'bold', fontSize: '0.9rem' }}><FiType /> Note</div> <textarea defaultValue={node.content} onBlur={e => onUpdate(node.id, { content: e.target.value })} onPointerDown={e => e.stopPropagation()} style={{ flex: 1, width: '100%', border: 'none', background: 'transparent', resize: 'none', outline: 'none', fontSize: '1rem', lineHeight: 1.6, color: '#333' }} placeholder="Type something..." /> </div>)

// --- Connection Layer ---
const ConnectionLayer = ({ nodes, edges }) => {
    // We need to calculate paths. SVG layer sits behind nodes.
    return (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
            {edges.map(edge => {
                const fromNode = nodes.find(n => n.id === edge.from)
                const toNode = nodes.find(n => n.id === edge.to)
                if (!fromNode || !toNode) return null

                // Calculate center (approx 150, 120 offset for half width/height)
                const startX = fromNode.x + 150; const startY = fromNode.y + 120
                const endX = toNode.x + 150; const endY = toNode.y + 120

                // Bezier Curve
                // Control points: 50% distance horizontally
                const dist = Math.abs(endX - startX)
                const c1x = startX + dist * 0.5
                const c1y = startY
                const c2x = endX - dist * 0.5
                const c2y = endY

                return (
                    <motion.path
                        key={edge.id}
                        d={`M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`}
                        fill="none"
                        stroke="#b0b0b0"
                        strokeWidth="3"
                        strokeDasharray="5 5" // Dashed line for 'flow'
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 50, damping: 20 }} // Bouncy draw
                    />
                )
            })}
        </svg>
    )
}

// --- Draggable Node ---
const DraggableNode = ({ node, isSelected, onSelect, onUpdatePosition, onUpdateData, onDelete }) => {
    const x = useMotionValue(node.x); const y = useMotionValue(node.y);
    const [isHovered, setIsHovered] = useState(false)
    useEffect(() => { x.set(node.x); y.set(node.y) }, [node.x, node.y, x, y])
    const colors = ['#ffffff', '#fff8dc', '#e6f7ff', '#f0fff0', '#fff0f5', '#f3e5f5']

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
                width: 320, minHeight: 240, padding: 25, borderRadius: 24, display: 'flex', flexDirection: 'column',
                background: node.color || 'rgba(255,255,255,0.9)',
                border: isSelected ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.8)',
                boxShadow: isSelected ? '0 15px 40px rgba(0,0,0,0.15)' : '0 10px 30px rgba(0,0,0,0.08)',
                backdropFilter: 'blur(20px)',
                transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
            }}>
                <AnimatePresence>
                    {isHovered && (
                        <>
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: -15, left: 20, display: 'flex', gap: 6, zIndex: 100, background: 'white', padding: '6px 10px', borderRadius: 20, boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                                {colors.map(c => <div key={c} onClick={(e) => { e.stopPropagation(); onUpdateData(node.id, { color: c }) }} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: '1px solid #eee', cursor: 'pointer', transform: node.color === c ? 'scale(1.2)' : 'scale(1)' }} />)}
                            </motion.div>
                            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => onDelete(node.id)} style={{ position: 'absolute', top: -12, right: -10, width: 32, height: 32, borderRadius: '50%', background: '#ff4d4f', color: 'white', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} onPointerDown={e => e.stopPropagation()}><FiTrash2 /></motion.button>
                        </>
                    )}
                </AnimatePresence>
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
        <div style={{ position: 'fixed', top: y, left: x, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: 8, zIndex: 1000, minWidth: 180, border: '1px solid rgba(0,0,0,0.05)' }}>
            <MenuItem icon={<FiCopy />} label="Duplicate" onClick={onCopy} />
            <MenuItem icon={<FiTrash2 />} label="Delete" onClick={onDelete} color="#ff6b6b" />
            <div style={{ height: 1, background: '#eee', margin: '5px 0' }}></div>
            <div style={{ padding: '0 12px', fontSize: '0.75rem', color: '#999', fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' }}>Move To</div>
            {pages.map(p => <MenuItem key={p} icon={<FiArrowRight />} label={p} onClick={() => onMove(p)} small />)}
            <div style={{ position: 'fixed', inset: 0, zIndex: -1 }} onClick={onClose}></div>
        </div>
    )
}
const MenuItem = ({ icon, label, onClick, color = '#333', small }) => (<button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: small ? '6px 12px' : '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color, fontSize: small ? '0.85rem' : '0.95rem', borderRadius: 8, transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = '#f5f7fa'} onMouseLeave={e => e.target.style.background = 'transparent'}> {icon} {label} </button>)

export default function Whiteboard({ nodes, edges = [], pages, onAddNode, onUpdateNodePosition, onUpdateNodeData, onDeleteNode, onBatchDelete, onBatchUpdate, onCopy, onPaste, onMoveToPage }) {
    const [scale, setScale] = useState(1); const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [selectedIds, setSelectedIds] = useState([])
    const [menu, setMenu] = useState({ x: 0, y: 0, visible: false })
    const containerRef = useRef()
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)

    // Optimized Auto Arrange
    const autoArrange = () => {
        const cols = Math.ceil(Math.sqrt(nodes.length))
        const updates = nodes.map((node, i) => ({ id: node.id, data: { x: 150 + (i % cols) * 360, y: 150 + Math.floor(i / cols) * 360 } }))
        if (onBatchUpdate) onBatchUpdate(updates)
    }

    useEffect(() => { const h = () => autoArrange(); window.addEventListener('ai-arrange', h); return () => window.removeEventListener('ai-arrange', h) }, [nodes])

    const handleNodeClick = (e, id) => { if (e.shiftKey || e.ctrlKey) { setSelectedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]) } else if (!selectedIds.includes(id)) { setSelectedIds([id]) } }
    const handleBgClick = (e) => { if (!e.shiftKey && !e.ctrlKey) setSelectedIds([]); setMenu({ ...menu, visible: false }) }
    const handleContextMenu = (e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, visible: true }) }
    useEffect(() => { const c = containerRef.current; if (!c) return; const w = (e) => { if (e.ctrlKey) { e.preventDefault(); setScale(p => Math.min(Math.max(0.1, p * Math.exp(-e.deltaY * 0.01)), 5)) } else { e.preventDefault(); setOffset(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY })) } }; c.addEventListener('wheel', w, { passive: false }); return () => c.removeEventListener('wheel', w) }, [])
    useEffect(() => { const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'c') onCopy(selectedIds); if ((e.ctrlKey || e.metaKey) && e.key === 'v') onPaste(); if (e.key === 'Delete' || e.key === 'Backspace') if (selectedIds.length > 0) onBatchDelete(selectedIds) }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [selectedIds, onCopy, onPaste, onBatchDelete])

    return (
        <div ref={containerRef} onContextMenu={handleContextMenu} onPointerDown={(e) => { if (e.target === containerRef.current) { setIsDraggingCanvas(true); e.target.setPointerCapture(e.pointerId); handleBgClick(e) } }} onPointerMove={(e) => { if (isDraggingCanvas) setOffset(p => ({ x: p.x + e.movementX, y: p.y + e.movementY })) }} onPointerUp={(e) => { setIsDraggingCanvas(false); if (e.target) e.target.releasePointerCapture(e.pointerId) }} style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#f8f9fa', position: 'relative', touchAction: 'none', cursor: isDraggingCanvas ? 'grabbing' : 'grab' }}>
            <div className="grid-bg" style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '24px 24px', transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0', opacity: 0.6, pointerEvents: 'none' }} />
            <motion.div style={{ width: '100%', height: '100%', x: offset.x, y: offset.y, scale, transformOrigin: '0 0', pointerEvents: 'none' }}>
                <ConnectionLayer nodes={nodes} edges={edges} />
                {nodes.map(node => (
                    <DraggableNode key={node.id} node={node} isSelected={selectedIds.includes(node.id)} onSelect={(e) => handleNodeClick(e, node.id)} onUpdatePosition={onUpdateNodePosition} onUpdateData={onUpdateNodeData} onDelete={onDeleteNode} />
                ))}
            </motion.div>
            <ContextMenu visible={menu.visible} x={menu.x} y={menu.y} pages={pages} onClose={() => setMenu({ ...menu, visible: false })} onCopy={() => { onCopy(selectedIds); setMenu({ ...menu, visible: false }) }} onDelete={() => { onBatchDelete(selectedIds); setMenu({ ...menu, visible: false }) }} onMove={(p) => { onMoveToPage(selectedIds, p); setMenu({ ...menu, visible: false }) }} />
            <motion.div className="glass-panel" style={{ position: 'absolute', bottom: 30, left: '50%', x: '-50%', padding: '12px 24px', display: 'flex', gap: 20, borderRadius: 24, zIndex: 100, pointerEvents: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }} initial={{ y: 100 }} animate={{ y: 0 }}>
                <ToolBtn icon={<FiType />} label="Note" onClick={() => onAddNode('Note')} />
                <ToolBtn icon={<FiCheckSquare />} label="Todo" onClick={() => onAddNode('Todo')} />
                <ToolBtn icon={<FiCalendar />} label="Calendar" onClick={() => onAddNode('Calendar')} />
                <ToolBtn icon={<FiImage />} label="Image" onClick={() => onAddNode('Image')} />
                <ToolBtn icon={<FiYoutube />} label="YouTube" onClick={() => onAddNode('YouTube')} />
                <div style={{ width: 1, height: 40, background: '#e0e0e0', margin: '0 5px' }}></div>
                <ToolBtn icon={<FiGrid />} label="Auto Arrange" onClick={autoArrange} />
            </motion.div>
        </div>
    )
}
const ToolBtn = ({ icon, label, onClick }) => (<motion.button whileHover={{ y: -5 }} whileTap={{ scale: 0.95 }} onClick={onClick} title={label} style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: 'white', color: '#444', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>{icon}</motion.button>)
