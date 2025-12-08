import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FiCalendar, FiCheckSquare, FiMessageSquare, FiImage, FiZoomIn, FiZoomOut, FiMaximize } from 'react-icons/fi'

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
            <div className="glass-panel" style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 10, padding: 10 }}>
                <button onClick={() => handleZoom(0.1)} style={btnStyle} title="Zoom In"><FiZoomIn /></button>
                <button onClick={() => handleZoom(-0.1)} style={btnStyle} title="Zoom Out"><FiZoomOut /></button>
                <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }) }} style={btnStyle} title="Reset"><FiMaximize /></button>
            </div>

            {/* Infinite Canvas Container */}
            <motion.div
                style={{
                    width: '100%', height: '100%',
                    cursor: 'grab'
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
                    backgroundImage: 'radial-gradient(#ddd 1px, transparent 1px)',
                    backgroundSize: '30px 30px', opacity: 0.5, pointerEvents: 'none'
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

            {/* Toolbar */}
            <motion.div
                className="glass-panel"
                style={{
                    position: 'absolute', bottom: 40, left: '50%', x: '-50%',
                    padding: '12px 24px', display: 'flex', gap: 20, zIndex: 100
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
    // When zoomed, drag offset must be adjusted? 
    // Framer Motion handles standard drag well inside scaled container.
    return (
        <motion.div
            drag
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={(e, info) => {
                // Adjust offset by scale to keep 1:1 movement
                onDragEnd({ x: info.offset.x / scale, y: info.offset.y / scale })
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ x: node.x, y: node.y, scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02, zIndex: 10, boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}
            whileDrag={{ scale: 1.05, zIndex: 100, cursor: 'grabbing' }}
            className="glass-panel"
            style={{
                position: 'absolute',
                top: 0, left: 0, // Reset standard positioning, use transform (animate) instead
                width: 320, minHeight: 200, padding: 0,
                display: 'flex', flexDirection: 'column',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px)'
            }}
        >
            {/* Header */}
            <div style={{
                padding: '15px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.5)', borderRadius: '16px 16px 0 0'
            }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {node.type}
                </span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fab005' }} />
            </div>

            {/* Content */}
            <div style={{ pading: 20, flex: 1 }}>
                {node.type === NODE_TYPES.CALENDAR ? <CalendarContent /> : (
                    <div
                        style={{ padding: 20, outline: 'none', lineHeight: '1.6', minHeight: 100 }}
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
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', color: '#888' }}>{d}</div>)}
                {Array.from({ length: 30 }, (_, i) => (
                    <div key={i} style={{
                        textAlign: 'center', padding: 5, borderRadius: 5, cursor: 'pointer',
                        background: i === 7 ? 'var(--primary)' : 'transparent',
                        color: i === 7 ? 'white' : 'inherit'
                    }}>{i + 1}</div>
                ))}
            </div>
            <a
                href="https://calendar.google.com/calendar/u/0/r/eventedit"
                target="_blank"
                rel="noreferrer"
                style={{
                    display: 'block', textAlign: 'center', padding: '10px',
                    background: 'var(--primary)', color: 'white', textDecoration: 'none',
                    borderRadius: 8, fontSize: '0.9rem'
                }}
            >
                + Add to Google Calendar
            </a>
        </div>
    )
}

function ToolButton({ icon, onClick, label }) {
    return (
        <button onClick={onClick} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{ padding: 12, borderRadius: '50%', background: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', color: '#333', fontSize: '1.3rem' }}>
                {icon}
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{label}</span>
        </button>
    )
}

const btnStyle = {
    width: 36, height: 36, borderRadius: 8, border: 'none', background: 'white',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
}
