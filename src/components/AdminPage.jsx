import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiSave, FiUsers, FiSettings, FiActivity, FiSearch, FiPlus, FiTrash2 } from 'react-icons/fi'
import { db } from '../firebase'
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore'

// Simple Admin List (For prototype safety, ideally in Firestore rules)
const ADMIN_EMAILS = [
    'aries0d0f@gmail.com',
    'aries.wu@ideabomb.com',
    'arieswu001@gmail.com'
]

export default function AdminPage({ user }) {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('users') // 'users' | 'settings'
    const [config, setConfig] = useState({
        userQuotas: {}, // { 'email': { limit: 100, tier: 'premium' } }
        globalEnabled: true,
        maintenanceMode: false,
        systemMessage: ''
    })
    const [loading, setLoading] = useState(true)
    const [newUserEmail, setNewUserEmail] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (!user) { navigate('/login'); return }
        // Simple client-side guard (Secure via Firestore Rules later)
        // if (!ADMIN_EMAILS.includes(user.email)) { alert("Access Denied"); navigate('/dashboard'); return }

        // Fetch Settings
        const unsub = onSnapshot(doc(db, 'settings', 'ai_config'), (snap) => {
            if (snap.exists()) {
                setConfig(snap.data())
            } else {
                // Init default config if missing
                setDoc(doc(db, 'settings', 'ai_config'), {
                    userQuotas: {},
                    globalEnabled: true,
                    maintenanceMode: false,
                    systemMessage: ''
                })
            }
            setLoading(false)
        })
        return unsub
    }, [user, navigate])

    const handleSaveQuota = async (email, tier, limit) => {
        const newQuotas = { ...config.userQuotas, [email]: { tier, limit: Number(limit) } }
        await updateDoc(doc(db, 'settings', 'ai_config'), { userQuotas: newQuotas })
    }

    const handleDeleteUser = async (email) => {
        const newQuotas = { ...config.userQuotas }
        delete newQuotas[email]
        await updateDoc(doc(db, 'settings', 'ai_config'), { userQuotas: newQuotas })
    }

    const toggleGlobal = async (key) => {
        await updateDoc(doc(db, 'settings', 'ai_config'), { [key]: !config[key] })
    }

    // Filtered Users
    const usersList = Object.entries(config.userQuotas || {})
        .filter(([email]) => email.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a[0].localeCompare(b[0]))

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Admin Panel...</div>

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '20px' }}>
            {/* Header */}
            <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <button onClick={() => navigate('/dashboard')} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FiArrowLeft /></button>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#111' }}>Admin Console</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', padding: '6px 12px', borderRadius: 20, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <img src={user.photoURL} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user.displayName} (Admin)</span>
                </div>
            </div>

            <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '250px 1fr', gap: 30 }}>
                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <NavBtn icon={<FiUsers />} label="User Management" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    <NavBtn icon={<FiSettings />} label="Global Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                    {/* <NavBtn icon={<FiActivity />} label="Audit Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} /> */}
                </div>

                {/* Content */}
                <div style={{ background: 'white', borderRadius: 16, padding: 30, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', minHeight: 500 }}>
                    {activeTab === 'users' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h2 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: 15 }}>AI Quota Management</h2>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>Manage AI token limits and tiers for specific users. Default is "Free" (10 requests/day).</p>

                            <div style={{ display: 'flex', gap: 10, marginBottom: 20, marginTop: 20 }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <FiSearch style={{ position: 'absolute', left: 12, top: 12, color: '#999' }} />
                                    <input placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, border: '1px solid #ddd', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    <input placeholder="New user email..." value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid #ddd', outline: 'none', width: 200 }} />
                                    <button onClick={() => { if (newUserEmail) { handleSaveQuota(newUserEmail, 'Standard', 50); setNewUserEmail('') } }} style={{ background: '#111', color: 'white', border: 'none', borderRadius: 8, padding: '0 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><FiPlus /> Add</button>
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f9f9f9', textAlign: 'left', fontSize: '0.85rem', color: '#666' }}>
                                        <th style={{ padding: 12, borderRadius: '8px 0 0 8px' }}>User Email</th>
                                        <th style={{ padding: 12 }}>Tier</th>
                                        <th style={{ padding: 12 }}>Daily Limit</th>
                                        <th style={{ padding: 12, borderRadius: '0 8px 8px 0' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersList.length === 0 && <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#999' }}>No custom quotas configured.</td></tr>}
                                    {usersList.map(([email, data]) => (
                                        <tr key={email} style={{ borderBottom: '1px solid #f1f1f1' }}>
                                            <td style={{ padding: 15, fontWeight: 500 }}>{email}</td>
                                            <td style={{ padding: 15 }}>
                                                <select value={data.tier} onChange={(e) => handleSaveQuota(email, e.target.value, data.limit)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd' }}>
                                                    <option value="Free">Free</option>
                                                    <option value="Standard">Standard</option>
                                                    <option value="Pro">Pro</option>
                                                    <option value="Enterprise">Enterprise</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: 15 }}>
                                                <input type="number" value={data.limit} onChange={(e) => handleSaveQuota(email, data.tier, e.target.value)} style={{ width: 60, padding: 4, borderRadius: 4, border: '1px solid #ddd' }} />
                                            </td>
                                            <td style={{ padding: 15 }}>
                                                <button onClick={() => handleDeleteUser(email)} style={{ background: '#fff1f0', color: 'red', border: 'none', padding: 6, borderRadius: 4, cursor: 'pointer' }}><FiTrash2 /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h2 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: 15 }}>Global Configuration</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, border: '1px solid #eee', borderRadius: 12 }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>Enable AI Features</h3>
                                        <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.85rem' }}>Globally enable or disable all AI generation capabilities.</p>
                                    </div>
                                    <Toggle checked={config.globalEnabled} onClick={() => toggleGlobal('globalEnabled')} />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, border: '1px solid #eee', borderRadius: 12 }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>Maintenance Mode</h3>
                                        <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.85rem' }}>Show a maintenance banner to all users and disable writes.</p>
                                    </div>
                                    <Toggle checked={config.maintenanceMode} onClick={() => toggleGlobal('maintenanceMode')} />
                                </div>

                                <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 12 }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>System Announcement</h3>
                                    <textarea
                                        value={config.systemMessage}
                                        onChange={(e) => updateDoc(doc(db, 'settings', 'ai_config'), { systemMessage: e.target.value })}
                                        placeholder="Enter a message to broadcast to all users..."
                                        style={{ width: '100%', height: 80, padding: 10, borderRadius: 8, border: '1px solid #ddd', resize: 'none' }}
                                    />
                                    <p style={{ fontSize: '0.8rem', color: '#999', margin: '5px 0 0' }}>Auto-saves as you type.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}

const NavBtn = ({ icon, label, active, onClick }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderRadius: 8, background: active ? '#fff' : 'transparent', color: active ? '#111' : '#666', fontWeight: active ? 600 : 400, boxShadow: active ? '0 2px 10px rgba(0,0,0,0.05)' : 'none' }}>
        {icon}
        <span>{label}</span>
    </div>
)

const Toggle = ({ checked, onClick }) => (
    <div onClick={onClick} style={{ width: 44, height: 24, background: checked ? '#111' : '#ccc', borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
        <div style={{ width: 20, height: 20, background: 'white', borderRadius: '50%', position: 'absolute', top: 2, left: checked ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
)
