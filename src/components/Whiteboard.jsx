import React from 'react'
import { motion } from 'framer-motion'
import { FiCalendar, FiCheckSquare, FiMessageSquare, FiImage } from 'react-icons/fi'

const NODE_TYPES = {
    NOTE: 'Note',
    TODO: 'Todo',
    CALENDAR: 'Calendar',
    MARKETING: 'Marketing'
}

export default function Whiteboard({ nodes, onAddNode, onUpdateNodePosition }) {
    return (
        <div className="whiteboard-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Dot Grid Background */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px', opacity: 0.5, pointerEvents: 'none'
            }} />

            {/* Nodes */}
            {nodes.map(node => (
                <DraggableNode
                    key={node.id}
                    node={node}
                    onDragEnd={(offset) => onUpdateNodePosition(node.id, offset)}
                />
            ))}

            {/* Floating Toolbar */}
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

function DraggableNode({ node, onDragEnd }) {
    return (
        <motion.div
            drag
            dragMomentum={false}
            onDragEnd={(e, info) => onDragEnd(info.offset)}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}
            className="glass-panel"
            style={{
                position: 'absolute',
                left: node.x, top: node.y,
                width: 280, minHeight: 180, padding: '20px',
                cursor: 'grab', background: 'rgba(255, 255, 255, 0.65)',
                display: 'flex', flexDirection: 'column'
            }}
        >
            <div style={{
                display: 'flex', justifyContent: 'space-between', marginBottom: 15,
                borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 10,
                color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem'
            }}>
                {node.type}
            </div>
            <div
                style={{ flex: 1, outline: 'none', lineHeight: '1.6', fontSize: '0.95rem' }}
                contentEditable suppressContentEditableWarning
            >
                {node.content}
            </div>
        </motion.div>
    )
}

function ToolButton({ icon, onClick, label }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: 'transparent', border: 'none', fontSize: '1.2rem', color: 'var(--text-main)',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5
            }}
            title={label}
        >
            <div style={{
                padding: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.5)',
                display: 'flex', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}>
                {icon}
            </div>
        </button>
    )
}
