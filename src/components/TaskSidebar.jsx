import React from 'react'
import { motion } from 'framer-motion'
import { FiInbox, FiSun, FiCalendar, FiHash, FiPlus, FiBriefcase } from 'react-icons/fi'

export default function TaskSidebar({ activeView, setActiveView, lists, onAddList }) {
    const navItems = [
        { id: 'inbox', label: 'Inbox', icon: <FiInbox />, color: '#246fe0', count: 4 },
        { id: 'today', label: 'Today', icon: <FiSun />, color: '#058527', count: 2 },
        { id: 'upcoming', label: 'Upcoming', icon: <FiCalendar />, color: '#692fc2', count: 0 },
    ]

    return (
        <div style={{
            width: 280,
            background: 'rgba(250, 250, 250, 0.8)',
            backdropFilter: 'blur(12px)',
            borderRight: '1px solid rgba(0,0,0,0.05)',
            padding: '24px 12px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            userSelect: 'none'
        }}>
            {/* User Profile / Workspace Placeholder */}
            <div style={{ marginBottom: 24, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #FF6B6B, #556270)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
                    W
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#333' }}>Workspace</div>
                    <div style={{ fontSize: '0.75rem', color: '#999' }}>Free Plan</div>
                </div>
            </div>

            <div style={{ marginBottom: 24 }}>
                {navItems.map(item => (
                    <motion.div
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        whileHover={{ backgroundColor: activeView === item.id ? '#e8f0fe' : 'rgba(0,0,0,0.04)', scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        animate={{
                            backgroundColor: activeView === item.id ? '#e8f0fe' : 'rgba(0,0,0,0)',
                            color: activeView === item.id ? '#d93025' : '#444'
                        }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '8px 12px', borderRadius: 8,
                            cursor: 'pointer',
                            marginBottom: 4,
                            transition: 'background-color 0.2s'
                        }}
                    >
                        <span style={{ color: item.color, fontSize: '1.2rem', display: 'flex' }}>{item.icon}</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: activeView === item.id ? 600 : 500, flex: 1 }}>{item.label}</span>
                        {item.count > 0 && (
                            <span style={{ fontSize: '0.8rem', color: '#999', fontWeight: 500 }}>{item.count}</span>
                        )}
                    </motion.div>
                ))}
            </div>

            <div style={{ padding: '0 12px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#888', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                <span>PROJECTS</span>
                <motion.div
                    whileHover={{ scale: 1.2, color: '#333' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onAddList}
                    style={{ cursor: 'pointer', display: 'flex' }}
                >
                    <FiPlus size={16} />
                </motion.div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {lists.length === 0 && (
                    <div style={{ padding: '0 12px', color: '#bbb', fontSize: '0.9rem' }}>No projects yet.</div>
                )}
                {lists.map(list => (
                    <motion.div
                        key={list.id}
                        onClick={() => setActiveView(list.id)}
                        whileHover={{ x: 4, backgroundColor: 'rgba(0,0,0,0.02)' }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '8px 12px', borderRadius: 8,
                            cursor: 'pointer',
                            color: activeView === list.id ? '#1a73e8' : '#555',
                            position: 'relative',
                            fontWeight: activeView === list.id ? 600 : 400
                        }}
                    >
                        <span style={{ color: list.color || '#999' }}>●</span>
                        <span style={{ fontSize: '0.95rem', flex: 1 }}>{list.title}</span>
                        {/* Hover Actions could go here */}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
