import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { FiTrash2, FiCalendar, FiCheckSquare, FiImage, FiType, FiPlus, FiX, FiGrid, FiYoutube, FiCopy, FiScissors, FiClipboard, FiArrowRight } from 'react-icons/fi'

// --- Node Components (Unchanged) ---
const YouTubeNode = ({ node, onUpdate }) => {
    const [url, setUrl] = useState(''); const videoId = node.videoId
    const handleEmbed = () => { const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/); if (m && m[2].length === 11) { onUpdate(node.id, { videoId: m[2] }) } else alert("Invalid URL") }
    return <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}><h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 5, color: '#ff0000', display: 'flex', alignItems: 'center', gap: 5 }}><FiYoutube /> YouTube</h3>{videoId ? <div style={{ flex: 1, width: '100%', borderRadius: 8, overflow: 'hidden', background: 'black', position: 'relative' }}><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} frameBorder="0" allowFullScreen style={{ pointerEvents: 'auto' }} onPointerDown={e => e.stopPropagation()} /><button onClick={() => onUpdate(node.id, { videoId: null })} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', zIndex: 10 }}><FiX size={12} /></button></div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center', flex: 1 }} onPointerDown={e => e.stopPropagation()}>{node.content && node.content.startsWith('Search:') ? <div style={{ textAlign: 'center' }}><p>Suggested: {node.content.replace('Search:', '')}</p><a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(node.content.replace('Search:', ''))}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#ff0000', color: 'white', padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 'bold' }}>Open Search Results</a></div> : <><input type="text" placeholder="Paste YouTube URL..." value={url} onChange={e => setUrl(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd', width: '100%' }} /><button onClick={handleEmbed} style={{ background: '#ff0000', color: 'white', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer' }}>Embed Video</button></>}</div>}</div>
}
const TodoNode = ({ node, onUpdate }) => {
    const items = node.items || []; const [newItem, setNewItem] = useState('')
    const toggle = (i) => { const n = [...items]; n[i].done = !n[i].done; onUpdate(node.id, { items: n }) }
    return <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}><h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 5, color: 'var(--primary)' }}>To-Do</h3><div style={{ flex: 1, overflowY: 'auto' }}>{items.map((it, i) => <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}><input type="checkbox" checked={it.done} onChange={() => toggle(i)} onPointerDown={e => e.stopPropagation()} /><span style={{ flex: 1, textDecoration: it.done ? 'line-through' : 'none' }}>{it.text}</span></div>)}</div><form onSubmit={e => { e.preventDefault(); if (newItem) onUpdate(node.id, { items: [...items, { text: newItem, done: false }] }); setNewItem('') }} style={{ display: 'flex', marginTop: 10 }}><input value={newItem} onChange={e => setNewItem(e.target.value)} style={{ flex: 1 }} onPointerDown={e => e.stopPropagation()} /><button type="submit">+</button></form></div>
}
const CalendarNode = ({ node, onUpdate }) => {
    const events = node.events || {}; const [sel, setSel] = useState(null); const [txt, setTxt] = useState('')
    return <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}><h3 style={{ margin: '0 0 10px 0', color: 'var(--primary)' }}>Calendar</h3>{!sel ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4, flex: 1, overflowY: 'auto' }}>{Array.from({ length: 30 }, (_, i) => i + 1).map(d => <div key={d} onClick={() => { setSel(d); setTxt(events[d] || '') }} onPointerDown={e => e.stopPropagation()} style={{ background: events[d] ? 'var(--primary-light)' : 'rgba(255,255,255,0.5)', padding: 5, textAlign: 'center', cursor: 'pointer' }}>{d}{events[d] && '*'}</div>)}</div> : <div onPointerDown={e => e.stopPropagation()} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Day {sel}</strong><button onClick={() => setSel(null)}>x</button></div><textarea value={txt} onChange={e => setTxt(e.target.value)} style={{ flex: 1 }} /><button onClick={() => { const n = { ...events, [sel]: txt }; if (!txt) delete n[sel]; onUpdate(node.id, { events: n }); setSel(null) }}>Save</button></div>}</div>
}
<DraggableNode key={node.id} node={node} isSelected={selectedIds.includes(node.id)} onSelect={(e) => handleNodeClick(e, node.id)} onUpdatePosition={onUpdateNodePosition} onUpdateData={onUpdateNodeData} onDelete={onDeleteNode} />
                ))}
            </motion.div >

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
        </div >
    )
}
const ToolBtn = ({ icon, label, onClick }) => (<motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClick} title={label} style={{ width: 50, height: 50, borderRadius: '50%', border: 'none', background: 'white', color: 'var(--primary)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>{icon}</motion.button>)
