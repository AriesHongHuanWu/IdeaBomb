import React from 'react'
import { motion } from 'framer-motion'
import { FiInbox, FiSun, FiCalendar, FiHash, FiPlus } from 'react-icons/fi'

export default function TaskSidebar({ activeView, setActiveView, lists, onAddList }) {
    const navItems = [
        { id: 'inbox', label: 'Inbox', icon: <FiInbox />, color: '#246fe0' },
        { id: 'today', label: 'Today', icon: <FiSun />, color: '#058527' },
        { id: 'upcoming', label: 'Upcoming', icon: <FiCalendar />, color: '#692fc2' },
    ]

    return (
        <div style={{
            width: 280,
            background: '#fafafa',
            borderRight: '1px solid #f0f0f0',
            padding: '24px 12px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
        }}>
            <div style={{ marginBottom: 20 }}>
                {navItems.map(item => (
                    <motion.div
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        whileHover={{ background: 'rgba(0,0,0,0.03)' }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 16px', borderRadius: 8,
                            cursor: 'pointer',
                            background: activeView === item.id ? '#e8f0fe' : 'transparent',
                            color: activeView === item.id ? '#d93025' : '#333',
                            marginBottom: 4
                        }}
                    >
                        <span style={{ color: item.color, fontSize: '1.2rem', display: 'flex' }}>{item.icon}</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: activeView === item.id ? 600 : 400 }}>{item.label}</span>
                    </motion.div>
                ))}
            </div>

            <div style={{ padding: '0 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#666', fontSize: '0.9rem', fontWeight: 600 }}>
                <span>Projects</span>
                <FiPlus style={{ cursor: 'pointer' }} onClick={onAddList} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {lists.map(list => (
                    <motion.div
                        key={list.id}
                        onClick={() => setActiveView(list.id)}
                        whileHover={{ background: 'rgba(0,0,0,0.03)' }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '8px 16px', borderRadius: 8,
                            cursor: 'pointer',
                            background: activeView === list.id ? '#e8f0fe' : 'transparent',
                            color: activeView === list.id ? '#1a73e8' : '#333',
                        }}
                    >
                        <FiHash style={{ color: '#999' }} />
                        <span style={{ fontSize: '0.95rem' }}>{list.title}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
