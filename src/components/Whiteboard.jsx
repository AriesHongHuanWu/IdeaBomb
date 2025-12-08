import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCalendar, FiCheckSquare, FiMessageSquare, FiImage, FiZoomIn, FiZoomOut, FiMaximize, FiUserPlus, FiLayers } from 'react-icons/fi'

const NODE_TYPES = {
    NOTE: 'Note',
    TODO: 'Todo',
    CALENDAR: 'Calendar',
    MARKETING: 'Marketing'
}

export default function Whiteboard({ nodes, onAddNode, onUpdateNodePosition }) {
    const [scale, setScale] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })

    const handleZoom = (delta) => {
        setScale(s => Math.min(Math.max(0.5, s + delta), 2))
    }

    return (
        <div className="whiteboard-container" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#f8f9fa' }}>
            {/* Controls */}
            <div className="glass-panel" style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 10, padding: 8, borderRadius: 12 }}>
                <ControlBtn onClick={() => handleZoom(0.1)} icon={<FiZoomIn />} tooltip="Zoom In" />
                <ControlBtn onClick={() => handleZoom(-0.1)} icon={<FiZoomOut />} tooltip="Zoom Out" />
                <ControlBtn onClick={() => { setScale(1); setPan({ x: 0, y: 0 }) }} icon={<FiMaximize />} tooltip="Reset View" />
            </div>

            {/* Room/Auth Placeholder (Future) */}
            <div className="glass-panel" style={{ position: 'absolute', top: 20, right: 20, zIndex: 100, display: 'flex', gap: 10, padding: 8, borderRadius: 12 }}>
                <ControlBtn icon={<FiUserPlus />} tooltip="Invite (Coming Soon)" />
                <ControlBtn icon={<FiLayers />} tooltip="Rooms (Coming Soon)" />
            </div>

            {/* Infinite Canvas Container */}
            <motion.div
                onWheel={(e) => {
                    if (e.ctrlKey) {
                        handleZoom(e.deltaY * -0.005)
                    } else {
                        setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
                    }
                }}
                style={{
                    width: '100%', height: '100%',
                    cursor: 'grab', touchAction: 'none'
                }}
                drag
                dragConstraints={{ left: -3000, right: 3000, top: -3000, bottom: 3000 }}
                dragElastic={0}
                dragMomentum={false}
                onDragEnd={(e, info) => setPan(p => ({ x: p.x + info.offset.x, y: p.y + info.offset.y }))}
                animate={{ x: pan.x, y: pan.y, scale: scale }}
                transition={{ type: 'tween', duration: 0 }}
            >
                {/* Grid Pattern */}
                <div style={{
                    position: 'absolute', top: -5000, left: -5000, width: 10000, height: 10000,
                    backgroundImage: 'radial-gradient(rgba(0,0,0,0.15) 1.5px, transparent 1.5px)',
                    backgroundSize: '40px 40px', opacity: 0.6, pointerEvents: 'none'
                }} />

                {/* Nodes */}
                {nodes.map(node => (
                    <DraggableNode
                        key={node.id}
                        node={node}
                        scale={scale}
                        onDragEnd={(offset) => onUpdateNodePosition(node.id, offset)}
                    />
                ))}
            </motion.div>

            {/* Minimalist Floating Toolbar */}
            <motion.div
                className="glass-panel"
                style={{
                    position: 'absolute', bottom: 40, left: '50%', x: '-50%',
                    padding: '8px 12px', display: 'flex', gap: 12, zIndex: 100,
                    borderRadius: 50, background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                }}
                initial={{ y: 100 }} animate={{ y: 0 }}
            >
                <ToolButton icon={<FiMessageSquare />} label="Note" onClick={() => onAddNode(NODE_TYPES.NOTE)} />
                <ToolButton icon={<FiCheckSquare />} label="Todo" onClick={() => onAddNode(NODE_TYPES.TODO)} />
                <ToolButton icon={<FiCalendar />} label="Calendar" onClick={() => onAddNode(NODE_TYPES.CALENDAR)} />
                <ToolButton icon={<FiImage />} label="Idea" onClick={() => onAddNode(NODE_TYPES.MARKETING)} />
            </motion.div>
        </div>
    )
}

function DraggableNode({ node, onDragEnd, scale }) {
    return (
        <motion.div
            drag
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={(e, info) => {
                onDragEnd({ x: info.offset.x / scale, y: info.offset.y / scale })
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ x: node.x, y: node.y, scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02, zIndex: 10, boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}
            whileDrag={{ scale: 1.05, zIndex: 100, cursor: 'grabbing' }}
            className="glass-panel"
            style={{
                position: 'absolute',
                top: 0, left: 0,
                width: 320, minHeight: 200, padding: 0,
                display: 'flex', flexDirection: 'column',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px)',
                borderRadius: 24, margin: 0
            }}
        >
            <div style={{
                padding: '12px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid rgba(0,0,0,0.06)'
            }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {node.type}
                </span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fab005' }} />
            </div>
            <div style={{ padding: 0, flex: 1 }}>
                {node.type === NODE_TYPES.CALENDAR ? <CalendarContent /> : (
                    <div
                        style={{ padding: 20, outline: 'none', lineHeight: '1.6', minHeight: 120, fontSize: '1rem', color: '#333' }}
                        contentEditable suppressContentEditableWarning
                    >
                        {node.content}
                    </div>
                )}
            </div>
        </motion.div>
    )
}

function CalendarContent() {
    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 15 }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', color: '#999', fontWeight: 600 }}>{d}</div>)}
                {Array.from({ length: 30 }, (_, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.2, background: 'var(--primary)', color: 'white' }} style={{
                        textAlign: 'center', padding: 5, borderRadius: 8, cursor: 'pointer',
                        fontSize: '0.9rem', transition: 'background 0.2s'
                    }}>{i + 1}</motion.div>
                ))}
            </div>
            <a href="https://calendar.google.com/calendar/r" target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                Open Google Calendar &rarr;
            </a>
        </div>
    )
}

// Updated Minimalist ToolButton (No Text)
function ToolButton({ icon, onClick, label }) {
    return (
        <motion.button
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            title={label}
            style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0
            }}
        >
            <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                color: '#444', fontSize: '1.4rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {icon}
            </div>
        </motion.button>
    )
}

function ControlBtn({ onClick, icon, tooltip }) {
    return (
        <button onClick={onClick} title={tooltip} style={{
            width: 36, height: 36, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.8)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', color: '#555'
        }}>
            {icon}
        </button>
    )
}
