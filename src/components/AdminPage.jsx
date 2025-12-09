import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiSave, FiUsers, FiSettings, FiActivity, FiSearch, FiPlus, FiTrash2, FiCpu, FiAlertCircle } from 'react-icons/fi'
import { db } from '../firebase'
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection, query, getDocs } from 'firebase/firestore'

// Simple Admin List (For prototype safety, ideally in Firestore rules)
const ADMIN_EMAILS = [
    'aries0d0f@gmail.com',
    'aries.wu@ideabomb.com',
    'arieswu001@gmail.com'
]

export default function AdminPage({ user }) {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('users') // 'users' | 'settings' | 'stats'

    // Config
    const [config, setConfig] = useState({
        userQuotas: {}, // { 'email': { limit: 100, tier: 'pro' } }
        globalEnabled: true,
        maintenanceMode: false,
        systemMessage: '',
        defaultDailyLimit: 10
    })

    // Data
    const [allUsers, setAllUsers] = useState([])
    const [usageMap, setUsageMap] = useState({}) // { uid: count }
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (!user) { navigate('/login'); return }
        // if (!ADMIN_EMAILS.includes(user.email)) { alert("Access Denied"); navigate('/dashboard'); return }

        // 1. Fetch Config
        const unsubConfig = onSnapshot(doc(db, 'settings', 'ai_config'), (snap) => {
            if (snap.exists()) {
                setConfig(prev => ({ ...prev, ...snap.data() }))
            }
        })

        // 2. Fetch User Directory (Real-time)
        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
            const users = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
            setAllUsers(users)

            // 3. Fetch Today's Usage for these users
            // optimization: only fetch once or poll? For now, fetch once on list update
            fetchUsage(users)
        })

        setLoading(false)
        return () => { unsubConfig(); unsubUsers() }
    }, [user, navigate])

    const fetchUsage = async (users) => {
        const today = new Date().toISOString().split('T')[0]
        const newUsage = {}

        // This is N+1 reads, careful with scaling. For <100 users it's fine.
        await Promise.all(users.map(async (u) => {
            const snap = await getDoc(doc(db, 'users', u.uid, 'ai_usage', today))
            if (snap.exists()) {
                newUsage[u.uid] = snap.data().count
            } else {
                newUsage[u.uid] = 0
            }
        }))
        setUsageMap(newUsage)
    }

    const handleSaveQuota = async (email, tier, limit) => {
        const newQuotas = { ...config.userQuotas, [email]: { tier, limit: Number(limit) } }
        await updateDoc(doc(db, 'settings', 'ai_config'), { userQuotas: newQuotas })
    }

    const handleGlobalUpdate = async (field, value) => {
        await updateDoc(doc(db, 'settings', 'ai_config'), { [field]: value })
    }

    // Filter Logic
    const filteredUsers = allUsers.filter(u =>
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Control Center...</div>

    return (
        <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div style={{ maxWidth: 1200, margin: '0 auto', marginBottom: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <button onClick={() => navigate('/dashboard')} style={{ background: 'white', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}><FiArrowLeft size={20} /></button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1a1a1a', fontWeight: 700 }}>Admin Control Center</h1>
                        <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.9rem' }}>{allUsers.length} Users Registered • System Status: <span style={{ color: config.globalEnabled ? '#00b894' : '#d63031', fontWeight: 'bold' }}>{config.globalEnabled ? 'Online' : 'Paused'}</span></p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 15 }}>
                    <div style={{ background: 'white', padding: '10px 20px', borderRadius: 30, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FiCpu color="#0984e3" />
                        <span style={{ fontWeight: 600 }}>Total Usage Today: {Object.values(usageMap).reduce((a, b) => a + b, 0)}</span>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 30 }}>
                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <NavBtn icon={<FiUsers />} label="User Directory" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    <NavBtn icon={<FiSettings />} label="Global Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </div>

                {/* Content Area */}
                <div style={{ background: 'white', borderRadius: 20, padding: 35, boxShadow: '0 4px 25px rgba(0,0,0,0.03)', minHeight: 600 }}>

                    {activeTab === 'users' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>User Management</h2>
                                <div style={{ position: 'relative', width: 300 }}>
                                    <FiSearch style={{ position: 'absolute', left: 15, top: 12, color: '#aaa' }} />
                                    <input placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: 12, border: '1px solid #eee', background: '#f9f9f9', fontSize: '0.95rem' }} />
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f0f0f0', color: '#888', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                                            <th style={{ padding: '15px 10px', textAlign: 'left' }}>User</th>
                                            <th style={{ padding: '15px 10px', textAlign: 'left' }}>Tier / Quota</th>
                                            <th style={{ padding: '15px 10px', textAlign: 'left' }}>Today's Usage</th>
                                            <th style={{ padding: '15px 10px', textAlign: 'left' }}>Status</th>
                                            <th style={{ padding: '15px 10px', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(u => {
                                            const quota = config.userQuotas?.[u.email] || { tier: 'Default', limit: config.defaultDailyLimit || 10 }
                                            const usage = usageMap[u.uid] || 0
                                            const usagePercent = Math.min(100, (usage / quota.limit) * 100)

                                            return (
                                                <tr key={u.uid} style={{ borderBottom: '1px solid #f7f7f7' }}>
                                                    <td style={{ padding: '15px 10px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <img src={u.photoURL} style={{ width: 36, height: 36, borderRadius: '50%', background: '#eee' }} />
                                                            <div>
                                                                <div style={{ fontWeight: 600, color: '#2d3436' }}>{u.displayName}</div>
                                                                <div style={{ fontSize: '0.8rem', color: '#636e72' }}>{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '15px 10px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <span style={{ padding: '4px 10px', borderRadius: 15, background: quota.tier === 'Pro' ? '#e17055' : '#74b9ff', color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>{quota.tier}</span>
                                                            <span style={{ fontSize: '0.9rem', color: '#666' }}>{quota.limit} / day</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '15px 10px' }}>
                                                        <div style={{ width: 120 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                                                                <span>{usage} reqs</span>
                                                                <span style={{ color: usagePercent > 90 ? 'red' : '#aaa' }}>{Math.round(usagePercent)}%</span>
                                                            </div>
                                                            <div style={{ width: '100%', height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                                                                <div style={{ width: `${usagePercent}%`, height: '100%', background: usagePercent > 90 ? '#ff7675' : '#00cec9', borderRadius: 3 }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '15px 10px' }}>
                                                        <span style={{ color: '#00b894', fontSize: '0.85rem' }}>Active</span>
                                                    </td>
                                                    <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                                                        <button onClick={() => {
                                                            const newLimit = prompt(`Set new daily limit for ${u.displayName}:`, quota.limit)
                                                            if (newLimit && !isNaN(newLimit)) handleSaveQuota(u.email, 'Custom', newLimit)
                                                        }} style={{ fontSize: '0.8rem', padding: '6px 12px', border: '1px solid #ddd', borderRadius: 6, background: 'white', cursor: 'pointer' }}>Edit Limit</button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <h2 style={{ margin: '0 0 25px 0', fontSize: '1.4rem' }}>System Configuration</h2>

                            <div style={{ marginBottom: 30 }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 10 }}>Default Daily Limit (Global)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                    <input
                                        type="range" min="5" max="100" step="5"
                                        value={config.defaultDailyLimit || 10}
                                        onChange={(e) => handleGlobalUpdate('defaultDailyLimit', Number(e.target.value))}
                                        style={{ width: 200 }}
                                    />
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{config.defaultDailyLimit || 10}</div>
                                    <span style={{ color: '#888' }}>requests / user / day</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#999', marginTop: 5 }}>Applies to all users without a custom quota.</p>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '30px 0' }} />

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>AI System Status</h3>
                                    <p style={{ margin: '5px 0 0', color: '#666' }}>Kill-switch to immediately disable all AI generations.</p>
                                </div>
                                <Toggle checked={config.globalEnabled} onClick={() => handleGlobalUpdate('globalEnabled', !config.globalEnabled)} />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Maintenance Banner</h3>
                                    <p style={{ margin: '5px 0 0', color: '#666' }}>Show global warning banner to all users.</p>
                                </div>
                                <Toggle checked={config.maintenanceMode} onClick={() => handleGlobalUpdate('maintenanceMode', !config.maintenanceMode)} />
                            </div>

                            <div style={{ marginTop: 30 }}>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>System Announcement</h3>
                                <textarea
                                    value={config.systemMessage}
                                    onChange={(e) => handleGlobalUpdate('systemMessage', e.target.value)}
                                    placeholder="Enter urgent message..."
                                    style={{ width: '100%', height: 100, padding: 15, borderRadius: 12, border: '1px solid #ddd', fontSize: '1rem', fontFamily: 'inherit' }}
                                />
                            </div>

                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}

const NavBtn = ({ icon, label, active, onClick }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 20px', cursor: 'pointer', borderRadius: 12, background: active ? 'white' : 'transparent', color: active ? '#2d3436' : '#636e72', fontWeight: active ? 600 : 500, boxShadow: active ? '0 4px 15px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>
        {icon}
        <span>{label}</span>
    </div>
)

const Toggle = ({ checked, onClick }) => (
    <div onClick={onClick} style={{ width: 50, height: 28, background: checked ? '#00b894' : '#b2bec3', borderRadius: 20, position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
        <div style={{ width: 24, height: 24, background: 'white', borderRadius: '50%', position: 'absolute', top: 2, left: checked ? 24 : 2, transition: 'left 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
    </div>
)
