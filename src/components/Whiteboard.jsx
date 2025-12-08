import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, AnimatePresence } from 'framer-motion'
import { FiTrash2, FiCalendar, FiCheckSquare, FiImage, FiType, FiPlus, FiX, FiGrid, FiYoutube, FiCopy, FiArrowRight, FiLink, FiMaximize2 } from 'react-icons/fi'

// --- Utilities ---
const useDebounce = (callback, delay) => {
    const timeoutRef = useRef(null)
    return (...args) => { clearTimeout(timeoutRef.current); timeoutRef.current = setTimeout(() => callback(...args), delay) }
}
const Input = (props) => (<input {...props} style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)', outline: 'none', transition: 'all 0.2s', ...props.style }} onFocus={(e) => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)' }} onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.boxShadow = 'none'; if (props.onBlur) props.onBlur(e) }} />)
const Button = ({ children, onClick, variant = 'primary', style }) => { const bg = variant === 'danger' ? 'linear-gradient(135deg, #FF6B6B, #FF8787)' : 'linear-gradient(135deg, #4facfe, #00f2fe)'; return (<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClick} style={{ background: bg, border: 'none', color: 'white', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, boxShadow: '0 4px 10px rgba(0,0,0,0.1)', ...style }}> {children} </motion.button>) }
const ToolBtn = ({ icon, label, onClick, active }) => (<motion.button whileHover={{ y: -5 }} whileTap={{ scale: 0.95 }} onClick={onClick} title={label} style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: active ? '#007bff' : 'white', color: active ? 'white' : '#444', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>{icon}</motion.button>)

// --- Node Types ---
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
// Smart Anchor Logic: Connects the nearest/most logical sides of two nodes
const getAnchors = (n1, n2) => {
    const w1 = n1.w || 320; const h1 = n1.h || 240; const w2 = n2.w || 320; const h2 = n2.h || 240
    const c1 = { x: n1.x + w1 / 2, y: n1.y + h1 / 2 }; const c2 = { x: n2.x + w2 / 2, y: n2.y + h2 / 2 }
    const dx = c2.x - c1.x; const dy = c2.y - c1.y
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) return { sx: n1.x + w1, sy: n1.y + h1 / 2, ex: n2.x, ey: n2.y + h2 / 2, c1x: 50, c1y: 0, c2x: -50, c2y: 0 } // R -> L
        else return { sx: n1.x, sy: n1.y + h1 / 2, ex: n2.x + w2, ey: n2.y + h2 / 2, c1x: -50, c1y: 0, c2x: 50, c2y: 0 } // L -> R
    } else {
        if (dy > 0) return { sx: n1.x + w1 / 2, sy: n1.y + h1, ex: n2.x + w2 / 2, ey: n2.y, c1x: 0, c1y: 50, c2x: 0, c2y: -50 } // B -> T
        else return { sx: n1.x + w1 / 2, sy: n1.y, ex: n2.x + w2 / 2, ey: n2.y + h2, c1x: 0, c1y: -50, c2x: 0, c2y: 50 } // T -> B
    }
}
const ConnectionLayer = ({ nodes, edges, onDeleteEdge, mode }) => {
    return (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#b0b0b0" />
                </marker>
                <marker id="arrowhead-del" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ff4d4f" />
                </marker>
            </defs>
            {edges.map(edge => {
                const f = nodes.find(n => n.id === edge.from); const t = nodes.find(n => n.id === edge.to)
                if (!f || !t) return null
                const { sx, sy, ex, ey, c1x, c1y } = getAnchors(f, t)
                // Orthogonal Step Logic (Workflow Style)
                let pathD = ''
                if (Math.abs(c1x) > Math.abs(c1y)) { // Horizontal Flow
                    const midX = (sx + ex) / 2
                    pathD = `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ey} L ${ex} ${ey}`
                } else { // Vertical Flow
                    const midY = (sy + ey) / 2
                    pathD = `M ${sx} ${sy} L ${sx} ${midY} L ${ex} ${midY} L ${ex} ${ey}`
                }
                return (
                    <g key={edge.id} style={{ pointerEvents: 'auto', cursor: mode === 'delete' ? 'not-allowed' : 'pointer' }} onClick={() => onDeleteEdge(edge.id)}>
                        <path d={pathD} stroke="transparent" strokeWidth="20" fill="none" />
                        <motion.path d={pathD} stroke={mode === 'delete' ? '#ff4d4f' : '#b0b0b0'} strokeWidth="3" strokeDasharray={mode === 'delete' ? "0" : "5 5"} fill="none" markerEnd={mode === 'delete' ? "url(#arrowhead-del)" : "url(#arrowhead)"} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
                    </g>
                )
            })}
        </svg>
    )
}

// --- Draggable Node (Resizable) ---
const DraggableNode = ({ node, isSelected, onSelect, onUpdatePosition, onUpdateData, onDelete, onConnectStart }) => {
    const x = useMotionValue(node.x); const y = useMotionValue(node.y);
    const [isHovered, setIsHovered] = useState(false)
    const [size, setSize] = useState({ w: node.w || 320, h: node.h || 240 })
    useEffect(() => { x.set(node.x); y.set(node.y) }, [node.x, node.y, x, y])

    const handleResize = (e) => {
        e.stopPropagation();
        const startX = e.clientX; const startY = e.clientY
        const startW = size.w; const startH = size.h
        const onMove = (mv) => { setSize({ w: Math.max(200, startW + (mv.clientX - startX)), h: Math.max(150, startH + (mv.clientY - startY)) }) }
        const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); onUpdateData(node.id, { w: size.w, h: size.h }) }
        window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp)
    }

    return (
        <motion.div
            drag dragMomentum={false} dragElastic={0} onDragEnd={(e, i) => onUpdatePosition(node.id, i.offset)}
            onClick={(e) => { e.stopPropagation(); if (onConnectStart) { onConnectStart(node.id) } else { onSelect(e) } }}
            onContextMenu={(e) => { onSelect(e) }}
            onHoverStart={() => setIsHovered(true)} onHoverEnd={() => setIsHovered(false)}
            style={{ x, y, position: 'absolute', pointerEvents: 'auto', zIndex: isSelected ? 50 : 10, width: size.w, height: size.h }}
        >
            <div className="glass-panel" style={{
                width: '100%', height: '100%', padding: 25, borderRadius: 24, display: 'flex', flexDirection: 'column',
                background: node.color || 'rgba(255,255,255,0.9)',
                border: isSelected ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.8)',
                boxShadow: isSelected ? '0 15px 40px rgba(0,0,0,0.15)' : '0 10px 30px rgba(0,0,0,0.08)',
                backdropFilter: 'blur(20px)', transition: 'box-shadow 0.2s'
            }}>
                <div onPointerDown={handleResize} style={{ position: 'absolute', bottom: 5, right: 5, width: 20, height: 20, cursor: 'nwse-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiMaximize2 size={12} color="#aaa" /></div>

                {node.type === 'Todo' && <TodoNode node={node} onUpdate={onUpdateData} />}
                {node.type === 'Calendar' && <CalendarNode node={node} onUpdate={onUpdateData} />}
                {node.type === 'Image' && <ImageNode node={node} onUpdate={onUpdateData} />}
                {node.type === 'YouTube' && <YouTubeNode node={node} onUpdate={onUpdateData} />}
                {(!['Todo', 'Calendar', 'Image', 'YouTube'].includes(node.type)) && <NoteNode node={node} onUpdate={onUpdateData} />}
            </div>
            <AnimatePresence>{isHovered && !onConnectStart && (
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} onClick={() => onDelete(node.id)} style={{ position: 'absolute', top: -12, right: -10, width: 32, height: 32, borderRadius: '50%', background: '#ff4d4f', color: 'white', border: '2px solid white', cursor: 'pointer', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} onPointerDown={e => e.stopPropagation()}><FiTrash2 /></motion.button>
            )}</AnimatePresence>
        </motion.div>
    )
}

export default function Whiteboard({ nodes, edges = [], pages, onAddNode, onUpdateNodePosition, onUpdateNodeData, onDeleteNode, onBatchDelete, onBatchUpdate, onCopy, onPaste, onMoveToPage, onAddEdge, onDeleteEdge }) {
    const [scale, setScale] = useState(1); const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [selectedIds, setSelectedIds] = useState([])
    const containerRef = useRef()
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)
    const [connectMode, setConnectMode] = useState(false)
    const [connectStartId, setConnectStartId] = useState(null)
    const [selectionBox, setSelectionBox] = useState(null)

    const autoArrange = () => {
        const cols = Math.ceil(Math.sqrt(nodes.length))
        const updates = nodes.map((node, i) => ({ id: node.id, data: { x: 150 + (i % cols) * 360, y: 150 + Math.floor(i / cols) * 360 } }))
        if (onBatchUpdate) onBatchUpdate(updates)
    }

    const handlePointerDown = (e) => {
        if (connectMode) return
        if (e.target === containerRef.current) {
            if (e.shiftKey) {
                const { left, top } = containerRef.current.getBoundingClientRect()
                const x = (e.clientX - left - offset.x) / scale
                const y = (e.clientY - top - offset.y) / scale
                setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y })
                e.target.setPointerCapture(e.pointerId)
            } else {
                setIsDraggingCanvas(true); e.target.setPointerCapture(e.pointerId)
                if (!e.ctrlKey) setSelectedIds([])
            }
        }
    }

    const handlePointerMove = (e) => {
        if (selectionBox) {
            const { left, top } = containerRef.current.getBoundingClientRect()
            const x = (e.clientX - left - offset.x) / scale; const y = (e.clientY - top - offset.y) / scale
            setSelectionBox(prev => ({ ...prev, currentX: x, currentY: y }))
        } else if (isDraggingCanvas) {
            setOffset(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }))
        }
    }

    const handlePointerUp = (e) => {
        if (selectionBox) {
            const minX = Math.min(selectionBox.startX, selectionBox.currentX); const maxX = Math.max(selectionBox.startX, selectionBox.currentX)
            const minY = Math.min(selectionBox.startY, selectionBox.currentY); const maxY = Math.max(selectionBox.startY, selectionBox.currentY)
            const hitIds = nodes.filter(n => {
                const nw = n.w || 320; const nh = n.h || 240
                return (n.x < maxX && n.x + nw > minX && n.y < maxY && n.y + nh > minY)
            }).map(n => n.id)
            setSelectedIds(hitIds)
            setSelectionBox(null)
        }
        setIsDraggingCanvas(false)
        if (e.target) e.target.releasePointerCapture(e.pointerId)
    }

    const handleNodeConnect = (id) => {
        if (!connectMode) {
            if (selectedIds.includes(id) && e.ctrlKey) return
            setSelectedIds([id])
            return
        }
        if (!connectStartId) { setConnectStartId(id) }
        else {
            if (connectStartId !== id) { onAddEdge(connectStartId, id); setConnectMode(false); setConnectStartId(null) }
            else { setConnectStartId(null) }
        }
    }

    // Native wheel listener to prevent browser zoom
    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        const onWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
                const s = e.deltaY > 0 ? 0.9 : 1.1
                setScale(prev => Math.min(Math.max(prev * s, 0.2), 5))
            } else {
                e.preventDefault()
                setOffset(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
            }
        }
        container.addEventListener('wheel', onWheel, { passive: false })
        return () => container.removeEventListener('wheel', onWheel)
    }, [])

    return (
        <div ref={containerRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#f8f9fa', position: 'relative', touchAction: 'none', cursor: connectMode ? 'crosshair' : (isDraggingCanvas ? 'grabbing' : 'default') }}>
            <div className="grid-bg" style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '24px 24px', transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0', opacity: 0.6, pointerEvents: 'none' }} />
            <motion.div style={{ width: '100%', height: '100%', x: offset.x, y: offset.y, scale, transformOrigin: '0 0', pointerEvents: 'none' }}>
                <ConnectionLayer nodes={nodes} edges={edges} onDeleteEdge={onDeleteEdge} mode={connectMode ? 'view' : 'delete'} />
                {nodes.map(node => (
                    <DraggableNode key={node.id} node={node} isSelected={selectedIds.includes(node.id) || connectStartId === node.id} onSelect={(e) => { if (connectMode) handleNodeConnect(node.id); else if (e.shiftKey || e.ctrlKey) setSelectedIds(pre => [...pre, node.id]); else setSelectedIds([node.id]) }} onConnectStart={connectMode ? handleNodeConnect : null} onUpdatePosition={onUpdateNodePosition} onUpdateData={onUpdateNodeData} onDelete={onDeleteNode} />
                ))}
                {selectionBox && (
                    <div style={{ position: 'absolute', left: Math.min(selectionBox.startX, selectionBox.currentX), top: Math.min(selectionBox.startY, selectionBox.currentY), width: Math.abs(selectionBox.currentX - selectionBox.startX), height: Math.abs(selectionBox.currentY - selectionBox.startY), background: 'rgba(0, 123, 255, 0.2)', border: '1px solid #007bff', pointerEvents: 'none' }} />
                )}
            </motion.div>

            {/* Zoom Controls */}
            <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 5, zIndex: 100 }}>
                <button onClick={() => setScale(s => Math.min(s * 1.2, 5))} style={{ width: 32, height: 32, background: 'white', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                <div style={{ background: 'white', padding: 4, borderRadius: 4, fontSize: '0.7rem', textAlign: 'center', fontWeight: 'bold' }}>{Math.round(scale * 100)}%</div>
                <button onClick={() => setScale(s => Math.max(s / 1.2, 0.2))} style={{ width: 32, height: 32, background: 'white', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
            </div>

            <motion.div className="glass-panel" style={{ position: 'absolute', bottom: 30, left: '50%', x: '-50%', padding: '12px 24px', display: 'flex', gap: 20, borderRadius: 24, zIndex: 100, pointerEvents: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }} initial={{ y: 100 }} animate={{ y: 0 }}>
                <ToolBtn icon={<FiType />} label="Note" onClick={() => onAddNode('Note')} />
                <ToolBtn icon={<FiCheckSquare />} label="Todo" onClick={() => onAddNode('Todo')} />
                <ToolBtn icon={<FiCalendar />} label="Calendar" onClick={() => onAddNode('Calendar')} />
                <ToolBtn icon={<FiImage />} label="Image" onClick={() => onAddNode('Image')} />
                <ToolBtn icon={<FiYoutube />} label="YouTube" onClick={() => onAddNode('YouTube')} />
                <div style={{ width: 1, height: 40, background: '#e0e0e0', margin: '0 5px' }}></div>
                <ToolBtn icon={<FiLink />} label="Connect" active={connectMode} onClick={() => { setConnectMode(!connectMode); setConnectStartId(null) }} />
                <ToolBtn icon={<FiGrid />} label="Auto Arrange" onClick={autoArrange} />
            </motion.div>
            {connectMode && <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#007bff', color: 'white', padding: '10px 20px', borderRadius: 20, fontWeight: 'bold' }}>Select two nodes to connect</div>}
        </div>
    )
}
