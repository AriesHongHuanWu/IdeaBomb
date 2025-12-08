import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, AnimatePresence } from 'framer-motion'
import { FiTrash2, FiCalendar, FiCheckSquare, FiImage, FiType, FiPlus, FiX, FiGrid, FiYoutube, FiCopy, FiArrowRight, FiLink, FiMaximize2, FiGlobe, FiScissors, FiClipboard, FiLayers } from 'react-icons/fi'

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
    const events = node.events || {};
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [text, setText] = useState('');
    const addEvent = () => { if (date && text) { onUpdate(node.id, { events: { ...events, [date]: text } }); setText('') } };
    const sortedEvents = Object.entries(events).sort((a, b) => new Date(a[0]) - new Date(b[0]))
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#e67e22', fontWeight: 800, fontSize: '1.1rem', borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                <FiCalendar size={20} /> Agenda
            </div>
            {node.content && <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 10, padding: '6px 8px', background: 'rgba(0,0,0,0.03)', borderRadius: 6, fontStyle: 'italic' }}>{node.content}</div>}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
                {sortedEvents.length === 0 && <div style={{ textAlign: 'center', color: '#aaa', marginTop: 20, fontSize: '0.9rem' }}>No events planned</div>}
                {sortedEvents.map(([d, t]) => (
                    <div key={d} style={{ background: 'white', padding: '12px', borderRadius: 10, position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '4px solid #e67e22', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff0e6', padding: '4px 8px', borderRadius: 8, minWidth: 50 }}>
                            <span style={{ fontSize: '0.7rem', color: '#e67e22', fontWeight: 700, textTransform: 'uppercase' }}>{new Date(d).toLocaleString('default', { month: 'short' })}</span>
                            <span style={{ fontSize: '1.1rem', color: '#d35400', fontWeight: 800 }}>{new Date(d).getDate()}</span>
                        </div>
                        <div style={{ flex: 1, fontSize: '0.95rem', color: '#333', lineHeight: 1.4, marginTop: 2 }}>
                            {(typeof t === 'object' && t !== null) ? (t.text || t.title || t.content || JSON.stringify(t)) : t}
                        </div>
                        <FiX onClick={() => { const n = { ...events }; delete n[d]; onUpdate(node.id, { events: n }) }} style={{ cursor: 'pointer', color: '#ccc', fontSize: 16, marginTop: 4 }} onPointerDown={e => e.stopPropagation()} />
                    </div>
                ))}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid #eee' }} onPointerDown={e => e.stopPropagation()}>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #eee', width: 130, fontWeight: 500, fontSize: '0.9rem', outline: 'none', background: '#f9f9f9' }} />
                <div style={{ flex: 1, display: 'flex', gap: 5 }}>
                    <input placeholder="Event..." value={text} onChange={e => setText(e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid #eee', fontSize: '0.9rem', outline: 'none' }} onKeyDown={e => e.key === 'Enter' && addEvent()} />
                    <button onClick={addEvent} style={{ width: 36, height: 36, padding: 0, borderRadius: 10, background: '#e67e22', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiPlus /></button>
                </div>
            </div>
        </div>
    )
}
const ImageNode = ({ node, onUpdate }) => {
    const up = (e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onloadend = () => onUpdate(node.id, { src: r.result }); r.readAsDataURL(f) } }
    return (<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}> <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#9b59b6', fontWeight: 'bold' }}><FiImage size={18} /> Image</div> <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.03)', borderRadius: 12, overflow: 'hidden', position: 'relative' }}> {node.src ? (<> <img src={node.src} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> <button onClick={() => onUpdate(node.id, { src: '' })} style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer' }} onPointerDown={e => e.stopPropagation()}><FiX /></button> </>) : (<div style={{ textAlign: 'center' }} onPointerDown={e => e.stopPropagation()}> <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Upload Image</p> <input type="file" onChange={up} style={{ maxWidth: 180, marginTop: 10 }} /> </div>)} </div> </div>)
}

const LinkNode = ({ node, onUpdate }) => {
    const [url, setUrl] = useState(node.url || '');
    const saveUrl = () => { if (url) onUpdate(node.id, { url, content: url }) }
    let hostname = ''; let isValid = false
    try { if (node.content) { hostname = new URL(node.content).hostname; isValid = true } } catch (e) { }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#3498db', fontWeight: 'bold' }}><FiGlobe size={18} /> Web Link</div>
            {isValid ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <a href={node.content} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'rgba(255,255,255,0.5)', borderRadius: 12, textDecoration: 'none', color: '#333', border: '1px solid rgba(0,0,0,0.1)' }}>
                        <img src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`} style={{ width: 32, height: 32, borderRadius: 4 }} onError={(e) => e.target.style.display = 'none'} />
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{hostname}</div>
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>{node.content}</div>
                        </div>
                        <FiArrowRight style={{ marginLeft: 'auto' }} />
                    </a>
                    <button onClick={() => onUpdate(node.id, { content: '' })} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', alignSelf: 'center', fontSize: '0.8rem' }}>Edit URL</button>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: 5, marginTop: 'auto', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    {node.content && node.content.startsWith('Search:') ? (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 10px 0', color: '#666' }}>Suggested: <strong>{node.content.replace('Search:', '')}</strong></p>
                            <Button onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(node.content.replace('Search:', ''))}`, '_blank')}>Search Google</Button>
                        </div>
                    ) : (
                        <>
                            {node.content && <p style={{ fontSize: '0.8rem', color: 'red', wordBreak: 'break-all' }}>Invalid URL: {node.content}</p>}
                            <div style={{ display: 'flex', gap: 5, width: '100%' }}>
                                <Input placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} />
                                <Button onClick={saveUrl}>Save</Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

const NoteNode = ({ node, onUpdate }) => {
    const taRef = useRef(null)
    useEffect(() => { if (taRef.current) { taRef.current.style.height = 'auto'; taRef.current.style.height = taRef.current.scrollHeight + 'px' } }, [node.content])
    return (<div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}> <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, color: '#555', fontWeight: 'bold', fontSize: '0.9rem' }}><FiType /> Note</div> <textarea ref={taRef} defaultValue={node.content} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }} onBlur={e => onUpdate(node.id, { content: e.target.value })} onPointerDown={e => e.stopPropagation()} style={{ flex: 1, width: '100%', border: 'none', background: 'transparent', resize: 'none', outline: 'none', fontSize: '1rem', lineHeight: 1.6, color: '#333', overflow: 'hidden', minHeight: 100 }} placeholder="Type something..." /> </div>)
}

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
const ConnectionLayer = ({ nodes, edges, onDeleteEdge, mode, tempEdge }) => {
    return (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
            <defs>
                <linearGradient id="glass-gradient" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4facfe" />
                    <stop offset="100%" stopColor="#00f2fe" />
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="5" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#00f2fe" style={{ filter: 'drop-shadow(0 0 5px #00f2fe)' }} />
                </marker>
                <marker id="arrowhead-del" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ff4d4f" />
                </marker>
            </defs>
            {edges.map((edge, i) => {
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
                        <motion.path
                            d={pathD}
                            stroke="#5ac8fa"
                            strokeWidth="3"
                            strokeDasharray="10 10"
                            fill="none"
                            markerEnd={undefined}
                            initial={{ strokeDashoffset: 0 }}
                            animate={{ strokeDashoffset: [-20, 0] }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            style={{ filter: mode === 'delete' ? 'none' : 'drop-shadow(0 0 4px #5ac8fa)', strokeLinecap: 'round' }}
                        />
                    </g>
                )
            })}
            {tempEdge && (() => {
                const f = nodes.find(n => n.id === tempEdge.from)
                if (!f) return null
                const t = { x: tempEdge.to.x - 1, y: tempEdge.to.y - 1, w: 2, h: 2, id: 'temp' } // Fake target
                const { sx, sy, ex, ey } = getAnchors(f, t)
                const pathD = `M ${sx} ${sy} L ${ex} ${ey}`
                return (
                    <path d={pathD} stroke="#5ac8fa" strokeWidth="2" strokeDasharray="5 5" fill="none" markerEnd="url(#arrowhead)" style={{ filter: 'drop-shadow(0 0 4px #5ac8fa)' }} />
                )
            })()}
        </svg>
    )
}

// --- Draggable Node (Resizable + Handles) ---
const DraggableNode = ({ node, scale, isSelected, onSelect, onUpdatePosition, onUpdateData, onDelete, onConnectStart, onEdgeStart }) => {
    const x = useMotionValue(node.x); const y = useMotionValue(node.y);
    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [size, setSize] = useState({ w: node.w || 320, h: node.h || 240 })
    useEffect(() => { if (!isDragging) { x.set(node.x); y.set(node.y) } }, [node.x, node.y])

    const handleDragStart = (e) => {
        if (onConnectStart || e.button !== 0 || e.target.closest('button') || e.target.closest('input') || e.target.closest('.no-drag') || e.target.classList.contains('handle')) return
        e.stopPropagation();
        const startX = e.clientX; const startY = e.clientY
        const startNodeX = x.get(); const startNodeY = y.get()
        setIsDragging(true); onSelect(e)
        const onMove = (be) => { const dx = (be.clientX - startX) / (scale || 1); const dy = (be.clientY - startY) / (scale || 1); x.set(startNodeX + dx); y.set(startNodeY + dy) }
        const onUp = (be) => {
            window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); setIsDragging(false)
            const dx = (be.clientX - startX) / (scale || 1); const dy = (be.clientY - startY) / (scale || 1)
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) onUpdatePosition(node.id, { x: dx, y: dy })
        }
        window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp)
    }

    const handleResize = (e) => {
        e.stopPropagation();
        const startX = e.clientX; const startY = e.clientY
        const startW = size.w; const startH = size.h
        const onMove = (mv) => { setSize({ w: Math.max(200, startW + (mv.clientX - startX) / (scale || 1)), h: Math.max(150, startH + (mv.clientY - startY) / (scale || 1)) }) }
        const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); onUpdateData(node.id, { w: size.w, h: size.h }) }
        window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp)
    }

    const handleStyle = { position: 'absolute', width: 16, height: 16, background: '#007bff', borderRadius: '50%', cursor: 'crosshair', opacity: 1, zIndex: 200, transition: 'transform 0.2s', border: '2px solid white', boxShadow: '0 0 5px rgba(0,0,0,0.3)' }

    return (
        <motion.div
            onPointerDown={handleDragStart}
            onClick={(e) => { e.stopPropagation(); if (onConnectStart) { onConnectStart(node.id) } else { onSelect(e) } }}
            onContextMenu={(e) => { onSelect(e) }}
            onHoverStart={() => setIsHovered(true)} onHoverEnd={() => setIsHovered(false)}
            style={{ x, y, position: 'absolute', pointerEvents: 'auto', zIndex: isSelected || isDragging ? 50 : 10, width: size.w, minHeight: size.h }}
        >
            <div className="glass-panel" style={{
                width: '100%', minHeight: '100%', padding: 25, borderRadius: 16, display: 'flex', flexDirection: 'column',
                background: node.color || 'rgba(255,255,255,0.65)',
                border: isSelected ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.4)',
                boxShadow: isSelected || isDragging ? '0 15px 40px rgba(0,0,0,0.15)' : '0 10px 30px rgba(0,0,0,0.05)',
                backdropFilter: isDragging ? 'none' : 'blur(24px)', transition: 'box-shadow 0.2s, background 0.2s',
                overflow: 'hidden'
            }}>
                <div onPointerDown={handleResize} style={{ position: 'absolute', bottom: 5, right: 5, width: 24, height: 24, background: 'rgba(255,255,255,0.8)', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'nwse-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}><FiMaximize2 size={14} color="#666" /></div>

                {node.type === 'Todo' && <TodoNode node={node} onUpdate={onUpdateData} />}
                {node.type === 'Calendar' && <CalendarNode node={node} onUpdate={onUpdateData} />}
                {node.type === 'Image' && <ImageNode node={node} onUpdate={onUpdateData} />}
                {node.type === 'YouTube' && <YouTubeNode node={node} onUpdate={onUpdateData} />}
                {node.type === 'Link' && <LinkNode node={node} onUpdate={onUpdateData} />}
                {(!['Todo', 'Calendar', 'Image', 'YouTube', 'Link'].includes(node.type)) && <NoteNode node={node} onUpdate={onUpdateData} />}
            </div>

            {(isHovered || isSelected) && !isDragging && (
                <div style={{ position: 'absolute', top: -45, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 200, padding: 8, background: 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onEdgeStart(node.id, e) }} title="Connect" style={{ width: 32, height: 32, borderRadius: 8, background: '#4facfe', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiLink size={16} /></motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onDelete(node.id) }} title="Delete" style={{ width: 32, height: 32, borderRadius: 8, background: '#ff4d4f', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiTrash2 size={16} /></motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onCopy([node.id]) }} title="Copy" style={{ width: 32, height: 32, borderRadius: 8, background: '#fdda6e', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiCopy size={16} /></motion.button>
                </div>
            )}
        </motion.div>
    )
}


export default function Whiteboard({ nodes, edges = [], pages, onAddNode, onUpdateNodePosition, onUpdateNodeData, onDeleteNode, onBatchDelete, onBatchUpdate, onCopy, onPaste, onMoveToPage, onAddEdge, onDeleteEdge, cursors, onCursorMove }) {
    const [scale, setScale] = useState(1); const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [selectedIds, setSelectedIds] = useState([])
    const containerRef = useRef()
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)
    const [connectMode, setConnectMode] = useState(false)
    const [connectStartId, setConnectStartId] = useState(null)
    const [selectionBox, setSelectionBox] = useState(null)

    // Pinch Zoom State
    const [pinchDist, setPinchDist] = useState(null)
    const [startScale, setStartScale] = useState(1)

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

    const [tempEdge, setTempEdge] = useState(null)

    const handlePointerMove = (e) => {
        if (selectionBox) {
            const { left, top } = containerRef.current.getBoundingClientRect()
            const x = (e.clientX - left - offset.x) / scale; const y = (e.clientY - top - offset.y) / scale
            setSelectionBox(prev => ({ ...prev, currentX: x, currentY: y }))
        } else if (tempEdge) {
            const { left, top } = containerRef.current.getBoundingClientRect()
            const x = (e.clientX - left - offset.x) / scale; const y = (e.clientY - top - offset.y) / scale
            setTempEdge(prev => ({ ...prev, to: { x, y } }))
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
        if (tempEdge) {
            // Find hit node
            const { left, top } = containerRef.current.getBoundingClientRect()
            const x = (e.clientX - left - offset.x) / scale; const y = (e.clientY - top - offset.y) / scale
            const hitNode = nodes.find(n => x > n.x && x < n.x + (n.w || 320) && y > n.y && y < n.y + (n.h || 240))
            if (hitNode && hitNode.id !== tempEdge.from) {
                onAddEdge(tempEdge.from, hitNode.id)
            }
            setTempEdge(null)
        }
        setIsDraggingCanvas(false)
        if (e.target) e.target.releasePointerCapture(e.pointerId)
    }

    const handleNodeUpdatePos = (id, delta) => {
        if (selectedIds.includes(id) && selectedIds.length > 1) {
            const updates = selectedIds.map(sId => {
                const n = nodes.find(n => n.id === sId)
                if (!n) return null
                return { id: sId, data: { x: n.x + delta.x, y: n.y + delta.y } }
            }).filter(Boolean)
            if (onBatchUpdate) onBatchUpdate(updates)
        } else {
            onUpdateNodePosition(id, delta)
        }
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

    // Pinch Zoom Handlers
    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
            setPinchDist(d); setStartScale(scale)
        }
    }
    const handleTouchMove = (e) => {
        if (e.touches.length === 2 && pinchDist) {
            const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
            setScale(Math.min(Math.max(startScale * (d / pinchDist), 0.2), 5))
        }
    }
    const handleTouchEnd = () => setPinchDist(null)

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

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null) // {x, y, type, targetId}

    const handleNodeContextMenu = (e, id) => {
        e.preventDefault()
        e.stopPropagation()
        setContextMenu({ x: e.clientX, y: e.clientY, type: 'node', targetId: id })
        if (!selectedIds.includes(id)) {
            setSelectedIds([id])
        }
    }

    const handleBgContextMenu = (e) => {
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY, type: 'bg' })
    }

    const closeMenu = () => setContextMenu(null)

    // Close menu on click elsewhere
    useEffect(() => {
        const h = () => closeMenu()
        window.addEventListener('click', h)
        return () => window.removeEventListener('click', h)
    }, [])

    const getTargets = () => {
        if (!contextMenu || contextMenu.type !== 'node') return []
        return selectedIds.includes(contextMenu.targetId) ? selectedIds : [contextMenu.targetId]
    }

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return


            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedIds.length > 0) {
                    if (onBatchDelete) onBatchDelete(selectedIds)
                    else selectedIds.forEach(id => onDeleteNode(id))
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                e.preventDefault()
                if (selectedIds.length > 0) onCopy(selectedIds)
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                e.preventDefault()
                onPaste(mousePos.current.x, mousePos.current.y)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedIds, onBatchDelete, onDeleteNode, onCopy, onPaste])

    // Track mouse for paste position
    const mousePos = useRef({ x: 0, y: 0 })
    const handleGlobalMouseMove = (e) => {
        const { left, top } = containerRef.current ? containerRef.current.getBoundingClientRect() : { left: 0, top: 0 }
        const wx = (e.clientX - left - offset.x) / scale; const wy = (e.clientY - top - offset.y) / scale
        mousePos.current = { x: wx, y: wy }
        if (onCursorMove) onCursorMove(wx, wy)
    }

    return (

        <div ref={containerRef} onPointerDown={handlePointerDown} onPointerMove={(e) => { handlePointerMove(e); handleGlobalMouseMove(e) }} onPointerUp={handlePointerUp} onContextMenu={handleBgContextMenu} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#f8f9fa', position: 'relative', touchAction: 'none', cursor: connectMode ? 'crosshair' : (isDraggingCanvas ? 'grabbing' : 'default') }}>
            <div className="grid-bg" style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '24px 24px', transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0', opacity: 0.6, pointerEvents: 'none' }} />
            <motion.div style={{ width: '100%', height: '100%', x: offset.x, y: offset.y, scale, transformOrigin: '0 0', pointerEvents: 'none' }}>
                <ConnectionLayer nodes={nodes} edges={edges} onDeleteEdge={onDeleteEdge} mode={connectMode ? 'view' : 'delete'} tempEdge={tempEdge} />
                {nodes.map(node => (
                    <DraggableNode key={node.id} node={node} scale={scale} isSelected={selectedIds.includes(node.id) || connectStartId === node.id}
                        onSelect={(e) => { if (connectMode) handleNodeConnect(node.id); else if (e.shiftKey || e.ctrlKey) setSelectedIds(pre => [...pre, node.id]); else setSelectedIds([node.id]) }}
                        onConnectStart={connectMode ? ((id) => { if (connectStartId) { onAddEdge(connectStartId, id); setConnectStartId(null); setConnectMode(false) } else { setConnectStartId(id) } }) : null}
                        onEdgeStart={(id, e) => {
                            const startX = (e.clientX - offset.x) / scale; const startY = (e.clientY - offset.y) / scale
                            const { left, top } = containerRef.current.getBoundingClientRect()
                            setTempEdge({ from: id, to: { x: (e.clientX - left - offset.x) / scale, y: (e.clientY - top - offset.y) / scale } })
                            const onEdgeMove = (me) => {
                                const mx = (me.clientX - left - offset.x) / scale; const my = (me.clientY - top - offset.y) / scale
                                setTempEdge(prev => prev ? ({ ...prev, to: { x: mx, y: my } }) : null)
                            }
                            const onEdgeUp = (ue) => {
                                window.removeEventListener('pointermove', onEdgeMove); window.removeEventListener('pointerup', onEdgeUp)
                                const ux = (ue.clientX - left - offset.x) / scale; const uy = (ue.clientY - top - offset.y) / scale
                                const hitNode = nodes.find(n => ux >= n.x && ux <= n.x + (n.w || 320) && uy >= n.y && uy <= n.y + (n.h || 240))
                                if (hitNode && hitNode.id !== id) { onAddEdge(id, hitNode.id) }
                                setTempEdge(null)
                            }
                            window.addEventListener('pointermove', onEdgeMove); window.addEventListener('pointerup', onEdgeUp)
                        }}
                        onUpdatePosition={handleNodeUpdatePos} onUpdateData={onUpdateNodeData} onDelete={onDeleteNode} onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
                    />
                ))}
                {cursors && Object.values(cursors).map(c => (
                    <div key={c.uid} style={{ position: 'absolute', left: c.x, top: c.y, pointerEvents: 'none', zIndex: 9999, transition: 'all 0.1s linear' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill={c.color || '#f00'} stroke="white" strokeWidth="2" style={{ transform: 'rotate(-15deg)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}><path d="M4 4l11 4-5 2 4 8-3 2-4-8-3 4z" /></svg>
                        <div style={{ background: c.color || '#f00', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', marginTop: 4, whiteSpace: 'nowrap', transform: 'translateX(10px)' }}>{c.displayName || 'User'}</div>
                    </div>
                ))}
                {selectionBox && (
                    <div style={{ position: 'absolute', left: Math.min(selectionBox.startX, selectionBox.currentX), top: Math.min(selectionBox.startY, selectionBox.currentY), width: Math.abs(selectionBox.currentX - selectionBox.startX), height: Math.abs(selectionBox.currentY - selectionBox.startY), background: 'rgba(0, 123, 255, 0.2)', border: '1px solid #007bff', pointerEvents: 'none' }} />
                )}
            </motion.div>

            {contextMenu && (
                <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 1000, padding: 6, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {contextMenu.type === 'node' ? (
                        <>
                            <button onClick={() => { onCopy(getTargets()); if (onBatchDelete) onBatchDelete(getTargets()); closeMenu() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem', color: '#333' }} onMouseEnter={e => e.target.style.background = '#f0f0f0'} onMouseLeave={e => e.target.style.background = 'transparent'}><FiScissors /> Cut</button>
                            <button onClick={() => { onCopy(getTargets()); closeMenu() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem', color: '#333' }} onMouseEnter={e => e.target.style.background = '#f0f0f0'} onMouseLeave={e => e.target.style.background = 'transparent'}><FiCopy /> Copy</button>
                            <button onClick={() => { onCopy(getTargets()); setTimeout(() => onPaste(contextMenu.x + 20, contextMenu.y + 20), 100); closeMenu() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem', color: '#333' }} onMouseEnter={e => e.target.style.background = '#f0f0f0'} onMouseLeave={e => e.target.style.background = 'transparent'}><FiLayers /> Duplicate</button>
                            <button onClick={() => { const t = getTargets(); if (onBatchDelete) onBatchDelete(t); else t.forEach(id => onDeleteNode(id)); closeMenu() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem', color: '#ff4d4f' }} onMouseEnter={e => e.target.style.background = '#fff1f0'} onMouseLeave={e => e.target.style.background = 'transparent'}><FiTrash2 /> Delete {getTargets().length > 1 && `(${getTargets().length})`}</button>

                            <div style={{ height: 1, background: '#eee', margin: '4px 0' }} />
                            <div style={{ padding: '4px 12px', fontSize: '0.75rem', color: '#999', fontWeight: 'bold' }}>MOVE TO PAGE</div>
                            <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {pages.map(p => (
                                    <button key={p} onClick={() => { onMoveToPage(getTargets(), p); closeMenu() }} style={{ display: 'block', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem', color: '#555' }} onMouseEnter={e => e.target.style.background = '#f0f0f0'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                                        <FiArrowRight style={{ marginRight: 5, verticalAlign: 'middle' }} /> {p}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <button onClick={() => { onPaste(contextMenu.x, contextMenu.y); closeMenu() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem', color: '#333' }} onMouseEnter={e => e.target.style.background = '#f0f0f0'} onMouseLeave={e => e.target.style.background = 'transparent'}><FiClipboard /> Paste Here</button>
                            <button onClick={() => { autoArrange(); closeMenu() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem', color: '#333' }} onMouseEnter={e => e.target.style.background = '#f0f0f0'} onMouseLeave={e => e.target.style.background = 'transparent'}><FiGrid /> Auto Arrange</button>
                        </>
                    )}
                </div>
            )}

            <motion.div className="glass-panel" style={{ position: 'absolute', bottom: 30, left: '50%', x: '-50%', padding: '12px 24px', display: 'flex', gap: 20, borderRadius: 24, zIndex: 100, pointerEvents: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }} initial={{ y: 100 }} animate={{ y: 0 }}>
                <ToolBtn icon={<FiType />} label="Note" onClick={() => onAddNode('Note')} />
                <ToolBtn icon={<FiCheckSquare />} label="Todo" onClick={() => onAddNode('Todo')} />
                <ToolBtn icon={<FiCalendar />} label="Calendar" onClick={() => onAddNode('Calendar')} />
                <ToolBtn icon={<FiImage />} label="Image" onClick={() => onAddNode('Image')} />
                <ToolBtn icon={<FiYoutube />} label="YouTube" onClick={() => onAddNode('YouTube')} />
                <ToolBtn icon={<FiGlobe />} label="Link" onClick={() => onAddNode('Link')} />
                <div style={{ width: 1, height: 40, background: '#e0e0e0', margin: '0 5px' }}></div>
                <ToolBtn icon={<FiLink />} label="Connect" active={connectMode} onClick={() => { setConnectMode(!connectMode); setConnectStartId(null) }} />
                <ToolBtn icon={<FiGrid />} label="Auto Arrange" onClick={autoArrange} />
            </motion.div>
            {connectMode && <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#007bff', color: 'white', padding: '10px 20px', borderRadius: 20, fontWeight: 'bold' }}>Select two nodes to connect</div>}
        </div>
    )
}
