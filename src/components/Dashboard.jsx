import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import { collection, addDoc, query, where, onSnapshot, setDoc, getDoc } from 'firebase/firestore'
import { FiPlus, FiLogOut, FiLayout, FiHome, FiFolder, FiUsers, FiGrid, FiShare2, FiClock, FiMoreVertical, FiEdit2, FiTrash2, FiMove, FiShield, FiGlobe, FiCheckSquare, FiCheckCircle, FiSettings, FiSun, FiMoon } from 'react-icons/fi'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { updateDoc, doc, deleteDoc } from 'firebase/firestore'
import TodoView from './TodoView'
import { writeBatch, getDocs } from 'firebase/firestore'
import { useSettings } from '../App'
import { messaging } from '../firebase'
import { getToken } from 'firebase/messaging'

// Helper for dates
const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString()
}

const NavItem = ({ icon, label, active, onClick, isMobile }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: 15,
            padding: '10px 20px',
            cursor: 'pointer',
            background: active ? '#e8f0fe' : 'transparent',
            color: active ? '#1a73e8' : '#5f6368',
            fontSize: '0.95rem',
            fontWeight: active ? 500 : 400,
            borderRight: active ? '3px solid #1a73e8' : '3px solid transparent'
        }}
    >
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        {!isMobile && <span>{label}</span>}
    </div>
)

export default function Dashboard({ user }) {
    const [boards, setBoards] = useState([])
    const navigate = useNavigate()
    const [activeView, setActiveView] = useState('all')
    const [selectedFolder, setSelectedFolder] = useState(null)
    const [showTodo, setShowTodo] = useState(false)
    const [selectedIds, setSelectedIds] = useState([])
    const [deletingIds, setDeletingIds] = useState([]) // Optimistic UI
    const isMobile = useMediaQuery('(max-width: 768px)')

    // Notification State
    const [notifPermission, setNotifPermission] = useState(Notification.permission)

    const handleEnableNotifications = async () => {
        if (!messaging) {
            alert("Messaging not supported in this browser.")
            return
        }
        try {
            const permission = await Notification.requestPermission()
            setNotifPermission(permission)

            if (permission === 'granted') {
                const token = await getToken(messaging, {
                    vapidKey: 'BMQJ2K5T3L8Z6X9Y4U1W7V0N2M5P8R6S1T4O9L2K8J7H6G5F4D3A2S1'
                })

                if (token) {
                    // 1. Save to Firestore
                    await setDoc(doc(db, 'fcm_tokens', user.email), {
                        token: token,
                        uid: user.uid,
                        updatedAt: new Date().toISOString()
                    })

                    // 2. Send Welcome Notification
                    await fetch('/api/notify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tokens: [token],
                            title: 'Notifications Enabled! 🎉',
                            body: 'You will now receive updates when mentioned in Team Chat.',
                            link: '/dashboard'
                        })
                    })
                    alert("Notifications enabled! A test message has been sent.")
                }
            }
        } catch (error) {
            console.error("Notification Error:", error)
            alert("Error enabling notifications: " + error.message)
        }
    }

    // Still try silent update if already granted (to keep token fresh)
    useEffect(() => {
        if (Notification.permission === 'granted' && messaging && user) {
            getToken(messaging, { vapidKey: 'BMQJ2K5T3L8Z6X9Y4U1W7V0N2M5P8R6S1T4O9L2K8J7H6G5F4D3A2S1' })
                .then(token => {
                    if (token) {
                        setDoc(doc(db, 'fcm_tokens', user.email), { token, uid: user.uid, updatedAt: new Date().toISOString() })
                    }
                })
                .catch(e => console.log('Silent token refresh failed', e))
        }
    }, [user])

    // Global Settings
    const { settings, setSettings, t, theme } = useSettings()

    // Modal State
    const [modalConfig, setModalConfig] = useState(null) // { type: 'create_folder' | 'rename' | 'settings' | ... }
    const [contextMenu, setContextMenu] = useState(null) // { x, y, boardId }

    // QueryMemo to prevent re-creation loop
    // Dependency on user.email (string) is safer than user (object)
    const boardsQuery = useMemo(() => {
        if (!user || !user.email) return null
        return query(
            collection(db, 'boards'),
            where('allowedEmails', 'array-contains', user.email)
        )
    }, [user?.email])

    useEffect(() => {
        if (!boardsQuery) return

        const unsubscribe = onSnapshot(boardsQuery, (snapshot) => {
            setBoards(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        }, (error) => {
            console.error("Dashboard Query Error:", error)
            // Do NOT set state here to avoid loops during error storms
        })

        return () => unsubscribe()
    }, [boardsQuery])

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null)
        window.addEventListener('click', handleClickOutside)
        return () => window.removeEventListener('click', handleClickOutside)
    }, [])

    // Helper: Smart Date Formatter
    const formatDate = (val) => {
        if (!val) return 'Unknown'
        const date = val.toDate ? val.toDate() : new Date(val)
        const now = new Date()
        const diff = (now - date) / 1000 // seconds

        if (diff < 60) return 'Just now'
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
        return date.toLocaleDateString()
    }

    // Derive unique folders from boards
    const folders = [...new Set(boards.map(b => b.folder).filter(f => f))]

    const getFilteredBoards = () => {
        let result = boards
        switch (activeView) {
            case 'shared':
                result = boards.filter(b => b.ownerId !== user.uid)
                break
            case 'created':
                result = boards.filter(b => b.ownerId === user.uid)
                break
            case 'folder':
                result = boards.filter(b => b.folder === selectedFolder)
                break
            case 'all':
            default:
                result = boards
                break
        }
        return result.filter(b => !deletingIds.includes(b.id))
    }

    const filteredBoards = getFilteredBoards()

    const createBoard = async () => {
        try {
            const docRef = await addDoc(collection(db, 'boards'), {
                title: "Untitled Board",
                createdBy: user.uid,
                ownerId: user.uid, // New field for easier filtering
                ownerEmail: user.email, // New field for easier display
                createdAt: new Date().toISOString(),
                allowedEmails: [user.email], // Add self to permission list
                members: [user.uid], // Start with self as member (legacy support)
                elements: [],
                folder: activeView === 'folder' ? selectedFolder : null,
                thumbnail: null // Placeholder for future preview feature
            })
            navigate(`/board/${docRef.id}`)
        } catch (e) {
            console.error("Error creating board", e)
            alert("Error creating board: " + e.message)
        }
    }



    const handleBatchAction = async (action, val) => {
        if (selectedIds.length === 0) return

        if (action === 'delete') {
            setModalConfig({
                type: 'confirm',
                title: `${t('deleteTitle')} (${selectedIds.length})`,
                message: t('deleteMsg'),
                onConfirm: async () => {
                    // Optimistic Update
                    const idsToDelete = [...selectedIds]
                    setDeletingIds(prev => [...prev, ...idsToDelete])
                    setSelectedIds([])
                    setModalConfig(null)

                    try {
                        const batch = writeBatch(db)
                        idsToDelete.forEach(bid => {
                            batch.delete(doc(db, 'boards', bid))
                        })
                        await batch.commit()
                    } catch (err) {
                        console.error("Batch delete failed", err)
                        alert("Batch delete failed: " + err.message)
                        // Revert optimistic update on error
                        setDeletingIds(prev => prev.filter(id => !idsToDelete.includes(id)))
                    }
                }
            })
        } else if (action === 'move') {
            try {
                const batch = writeBatch(db)
                selectedIds.forEach(bid => {
                    batch.update(doc(db, 'boards', bid), { folder: val === '' ? null : val })
                })
                await batch.commit()
                setSelectedIds([])
            } catch (e) {
                console.error("Batch move failed", e)
                alert("Batch move failed: " + e.message)
            }
        }
    }

    const handleAction = async (action, board, val) => {
        try {
            const boardRef = doc(db, 'boards', board.id)
            if (action === 'rename') {
                await updateDoc(boardRef, { title: val })
            } else if (action === 'move') {
                await updateDoc(boardRef, { folder: val === '' ? null : val })
            } else if (action === 'delete') {
                setContextMenu(null)
                setModalConfig({
                    type: 'confirm',
                    title: t('deleteTitle'),
                    message: t('deleteMsg'),
                    board: board, // crucial for handleAction id access
                    onConfirm: async () => {
                        // Optimistic Update
                        setDeletingIds(prev => [...prev, board.id])
                        setModalConfig(null)

                        // (Deep Delete Implementation)
                        try {
                            const batch = writeBatch(db)
                            const nodesSnap = await getDocs(collection(db, 'boards', board.id, 'nodes'))
                            nodesSnap.forEach(doc => batch.delete(doc.ref))
                            const edgesSnap = await getDocs(collection(db, 'boards', board.id, 'edges'))
                            edgesSnap.forEach(doc => batch.delete(doc.ref))
                            const msgsSnap = await getDocs(collection(db, 'boards', board.id, 'messages'))
                            msgsSnap.forEach(doc => batch.delete(doc.ref))
                            await batch.commit()
                            await deleteDoc(boardRef)
                        } catch (err) {
                            console.error("Deep delete failed", err)
                            alert("Failed to clean up board files: " + err.message)
                            setDeletingIds(prev => prev.filter(id => id !== board.id))
                        }
                    }
                })
                return
            }
        } catch (e) {
            console.error(e)
            alert(e.message)
        }
        setModalConfig(null)
    }

    const openContextMenu = (e, board) => {
        e.stopPropagation()
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY, board })
    }

    return (
        <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: '"Google Sans", "Inter", sans-serif', overflowX: 'hidden', color: theme.text }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', background: theme.header, borderBottom: `1px solid ${theme.border}` }}>
                <h1 onClick={() => navigate('/')} style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 10, margin: 0, cursor: 'pointer', color: theme.textPrim }}>
                    <img src="/logo.svg" alt="Logo" style={{ height: 24 }} /> IdeaBomb
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {notifPermission === 'default' && (
                        <button
                            onClick={handleEnableNotifications}
                            style={{
                                background: 'linear-gradient(135deg, #FF6B6B, #EE5253)',
                                color: 'white', border: 'none', padding: '8px 16px', borderRadius: 20,
                                cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8,
                                boxShadow: '0 4px 10px rgba(238, 82, 83, 0.3)', fontSize: '0.9rem'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>🔔</span> Enable Notifications
                        </button>
                    )}
                    {user && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.textPrim }}>
                            <img src={user.photoURL} alt="User" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                            {!isMobile && <span>{user.displayName}</span>}
                        </div>
                    )}
                    <button onClick={() => signOut(auth)} style={{ background: theme.bg, border: `1px solid ${theme.border}`, padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: theme.text }}>
                        <FiLogOut /> {t('signOut')}
                    </button>
                </div>
            </header >

            {/* Main Layout */}
            < div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }
            }>

                {/* Sidebar */}
                < div style={{
                    width: isMobile ? '60px' : '250px',
                    background: theme.sidebar,
                    borderRight: `1px solid ${theme.border}`,
                    padding: '20px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0
                }}>
                    <NavItem icon={<FiGlobe />} label={t('home')} active={false} onClick={() => navigate('/home')} isMobile={isMobile} />
                    <NavItem icon={<FiGrid />} label={t('all')} active={activeView === 'all'} onClick={() => { setActiveView('all'); setSelectedFolder(null) }} isMobile={isMobile} />
                    <NavItem icon={<FiLayout />} label={t('my')} active={activeView === 'created'} onClick={() => { setActiveView('created'); setSelectedFolder(null) }} isMobile={isMobile} />
                    <NavItem icon={<FiShare2 />} label={t('shared')} active={activeView === 'shared'} onClick={() => { setActiveView('shared'); setSelectedFolder(null) }} isMobile={isMobile} />

                    <NavItem
                        icon={<FiCheckCircle style={{ color: '#db4c3f' }} />}
                        label={t('todo')}
                        active={showTodo}
                        onClick={() => setShowTodo(!showTodo)}
                        isMobile={isMobile}
                    />

                    {/* Admin Link */}
                    {
                        ['aries0d0f@gmail.com', 'aries.wu@ideabomb.com', 'arieswu001@gmail.com'].includes(user?.email?.toLowerCase()) && (
                            <NavItem icon={<FiShield />} label={t('admin')} active={false} onClick={() => navigate('/admin')} isMobile={isMobile} />
                        )
                    }

                    <div style={{ margin: '10px 0', borderTop: `1px solid ${theme.border}` }}></div>

                    {
                        !isMobile && (
                            <div style={{ padding: '0 20px', marginBottom: 10, fontSize: '0.8rem', fontWeight: 'bold', color: theme.text }}>
                                {t('folders')}
                            </div>
                        )
                    }

                    {
                        folders.map(folder => (
                            <NavItem
                                key={folder}
                                icon={<FiFolder />}
                                label={folder}
                                active={activeView === 'folder' && selectedFolder === folder}
                                onClick={() => { setActiveView('folder'); setSelectedFolder(folder) }}
                                isMobile={isMobile}
                            />
                        ))
                    }

                    <div style={{ marginTop: 20 }}>
                        <NavItem
                            icon={<FiSettings />}
                            label={t('settings')}
                            active={false}
                            onClick={() => setModalConfig({ type: 'settings' })}
                            isMobile={isMobile}
                        />
                    </div>
                </div >

                {/* Content Area */}
                < div style={{ flex: 1, padding: isMobile ? '20px' : 40, height: '100%', overflow: 'hidden' }}>

                    {/* Todo Panel Integration */}
                    < TodoView user={user} isOpen={showTodo} onClose={() => setShowTodo(false)} />

                    {/* Dashboard Content */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                            <h1 style={{ fontSize: '1.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: theme.textPrim }}>
                                {activeView === 'folder' ? <><FiFolder /> {selectedFolder}</> :
                                    activeView === 'shared' ? <><FiShare2 /> {t('shared')}</> :
                                        activeView === 'created' ? <><FiLayout /> {t('my')}</> :
                                            <><FiGrid /> {t('all')}</>}
                            </h1>
                            <button
                                onClick={createBoard}
                                style={{
                                    padding: '10px 20px', background: '#1a73e8', color: 'white', border: 'none',
                                    borderRadius: 4, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                }}
                            >
                                <FiPlus /> {t('newBoard')}
                            </button>
                        </div>

                        {filteredBoards.length === 0 ? (
                            <div style={{ textAlign: 'center', marginTop: 80, color: theme.text }}>
                                <div style={{ fontSize: '3rem', marginBottom: 20, opacity: 0.2 }}><FiLayout /></div>
                                <p>{t('noBoards')}</p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: 20
                            }}>
                                {filteredBoards.map(board => {
                                    const isSelected = selectedIds.includes(board.id)
                                    return (
                                        <motion.div
                                            key={board.id}
                                            layoutId={board.id}
                                            whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                                            onClick={(e) => {
                                                if (selectedIds.length > 0 || e.ctrlKey || e.metaKey) {
                                                    // Selection Mode Logic
                                                    if (isSelected) setSelectedIds(s => s.filter(id => id !== board.id))
                                                    else setSelectedIds(s => [...s, board.id])
                                                } else {
                                                    navigate(`/board/${board.id}`)
                                                }
                                            }}
                                            style={{
                                                background: theme.cardBg, borderRadius: 8, border: isSelected ? '2px solid #1a73e8' : `1px solid ${theme.border}`,
                                                overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s',
                                                position: 'relative',
                                                transform: isSelected ? 'scale(0.98)' : 'scale(1)'
                                            }}
                                        >
                                            {/* Selection Checkbox */}
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isSelected) setSelectedIds(s => s.filter(id => id !== board.id))
                                                    else setSelectedIds(s => [...s, board.id])
                                                }}
                                                className="selection-checkbox"
                                                style={{
                                                    position: 'absolute', top: 10, right: 10, zIndex: 10,
                                                    width: 20, height: 20, borderRadius: 4,
                                                    border: isSelected ? 'none' : '2px solid rgba(0,0,0,0.2)',
                                                    background: isSelected ? '#1a73e8' : 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    opacity: (isSelected || selectedIds.length > 0) ? 1 : 0, // Show if selected or in mode
                                                    transition: 'opacity 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                            >
                                                {isSelected && <FiCheckSquare color="white" size={14} />}
                                            </div>
                                            <style>{`.selection-checkbox:hover { opacity: 1 !important; }`}</style>

                                            {/* Preview Area */}
                                            <div style={{ height: 140, background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${theme.border}`, position: 'relative' }}>
                                                {board.thumbnail ? (
                                                    <img src={board.thumbnail} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ opacity: 0.1, display: 'flex', flexDirection: 'column', alignItems: 'center', color: theme.text }}>
                                                        <FiLayout style={{ fontSize: '3rem' }} />
                                                    </div>
                                                )}
                                                {/* Folder Badge */}
                                                {board.folder && (
                                                    <div style={{
                                                        position: 'absolute', top: 10, left: 10,
                                                        background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 12,
                                                        fontSize: '0.75rem', color: theme.text, display: 'flex', alignItems: 'center', gap: 4
                                                    }}>
                                                        <FiFolder size={12} /> {board.folder}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info Area */}
                                            <div style={{ padding: 15 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: theme.textPrim, fontWeight: 500 }}>
                                                        {board.title || t('untitled')}
                                                    </h3>
                                                    <div
                                                        onClick={(e) => openContextMenu(e, board)}
                                                        style={{ cursor: 'pointer', padding: 6, borderRadius: '50%', color: theme.text, marginRight: -5 }}
                                                        onMouseEnter={e => e.target.style.background = 'rgba(0,0,0,0.05)'}
                                                        onMouseLeave={e => e.target.style.background = 'transparent'}
                                                    >
                                                        <FiMoreVertical />
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginTop: 10, fontSize: '0.8rem', color: theme.text }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Collaborators">
                                                        <FiUsers /> {board.allowedEmails?.length || 1}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title={t('lastActive')}>
                                                        <FiClock /> {formatDate(board.createdAt)}
                                                    </div>
                                                </div>

                                                {(board.createdBy !== user.uid && board.ownerEmail !== user.email) && (
                                                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: theme.activeText, background: theme.activeBg, display: 'inline-block', padding: '2px 6px', borderRadius: 4 }}>
                                                        {t('sharedBy')} {board.ownerEmail}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Batch Action Bar */}
                        <AnimatePresence>
                            {selectedIds.length > 0 && (
                                <motion.div
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    style={{
                                        position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
                                        background: theme.cardBg, padding: '10px 20px', borderRadius: 50,
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)', border: `1px solid ${theme.border}`,
                                        display: 'flex', alignItems: 'center', gap: 20, zIndex: 1000
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', color: theme.text, marginRight: 10 }}>
                                        {selectedIds.length} Selected
                                    </div>
                                    <button onClick={() => setSelectedIds([])} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.text }}>
                                        Cancel
                                    </button>
                                    <div style={{ width: 1, height: 20, background: theme.border }}></div>
                                    <button
                                        onClick={() => {
                                            const folder = prompt("Move to Folder name (leave empty to remove from folder):")
                                            if (folder !== null) handleBatchAction('move', folder)
                                        }}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#1a73e8' }}
                                    >
                                        <FiMove /> Move
                                    </button>
                                    <button
                                        onClick={() => handleBatchAction('delete')}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#d93025' }}
                                    >
                                        <FiTrash2 /> Delete
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div >
            </div >

            {/* Modal System */}
            {
                modalConfig && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            style={{
                                background: 'white', padding: 30, borderRadius: 24,
                                boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: '90%', maxWidth: 400,
                                border: '1px solid rgba(0,0,0,0.1)'
                            }}
                        >
                            {modalConfig.type === 'confirm' ? (
                                <>
                                    <h2 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', color: '#202124' }}>{modalConfig.title}</h2>
                                    <p style={{ color: '#666', marginBottom: 25, lineHeight: 1.5 }}>{modalConfig.message}</p>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                        <button onClick={() => setModalConfig(null)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'transparent', color: '#666', cursor: 'pointer' }}>{t('cancel')}</button>
                                        <button onClick={modalConfig.onConfirm} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#d93025', color: 'white', cursor: 'pointer', fontWeight: 600 }}>{t('confirm')}</button>
                                    </div>
                                </>
                            ) : modalConfig.type === 'settings' ? (
                                <>
                                    <h2 style={{ margin: '0 0 20px 0', fontSize: '1.4rem', color: '#202124', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <FiSettings /> {t('settings')}
                                    </h2>

                                    <div style={{ marginBottom: 20 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#5f6368', marginBottom: 10 }}>{t('theme')}</div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button
                                                onClick={() => setSettings(s => ({ ...s, theme: 'light' }))}
                                                style={{ flex: 1, padding: 12, borderRadius: 8, border: settings.theme === 'light' ? '2px solid #1a73e8' : '1px solid #dadce0', background: 'white', color: settings.theme === 'light' ? '#1a73e8' : '#5f6368', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                            >
                                                <FiSun /> {t('light')}
                                            </button>
                                            <button
                                                onClick={() => setSettings(s => ({ ...s, theme: 'dark' }))}
                                                style={{ flex: 1, padding: 12, borderRadius: 8, border: settings.theme === 'dark' ? '2px solid #1a73e8' : '1px solid #dadce0', background: '#333', color: settings.theme === 'dark' ? '#1a73e8' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                            >
                                                <FiMoon /> {t('dark')}
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 30 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#5f6368', marginBottom: 10 }}>{t('lang')}</div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button
                                                onClick={() => setSettings(s => ({ ...s, lang: 'en' }))}
                                                style={{ flex: 1, padding: 12, borderRadius: 8, border: settings.lang === 'en' ? '2px solid #1a73e8' : '1px solid #dadce0', background: settings.lang === 'en' ? '#e8f0fe' : 'transparent', color: settings.lang === 'en' ? '#1a73e8' : '#5f6368', cursor: 'pointer' }}
                                            >
                                                English
                                            </button>
                                            <button
                                                onClick={() => setSettings(s => ({ ...s, lang: 'zh-TW' }))}
                                                style={{ flex: 1, padding: 12, borderRadius: 8, border: settings.lang === 'zh-TW' ? '2px solid #1a73e8' : '1px solid #dadce0', background: settings.lang === 'zh-TW' ? '#e8f0fe' : 'transparent', color: settings.lang === 'zh-TW' ? '#1a73e8' : '#5f6368', cursor: 'pointer' }}
                                            >
                                                繁體中文
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setModalConfig(null)} style={{ padding: '10px 25px', borderRadius: 12, border: 'none', background: '#1a73e8', color: 'white', cursor: 'pointer', fontWeight: 600 }}>{t('confirm')}</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 style={{ margin: '0 0 20px 0', fontSize: '1.4rem', color: '#202124' }}>{modalConfig.title}</h2>
                                    <input
                                        autoFocus
                                        id="modal-input"
                                        defaultValue={modalConfig.initialValue}
                                        placeholder={t('typeHere')}
                                        onKeyDown={e => { if (e.key === 'Enter') handleAction(modalConfig.type, modalConfig.board, e.target.value) }}
                                        style={{
                                            width: '100%', padding: '12px 16px', borderRadius: 12,
                                            border: '1px solid #dadce0', fontSize: '1rem', outline: 'none',
                                            marginBottom: 20, background: '#f8f9fa'
                                        }}
                                        ref={input => input && (input.value = modalConfig.initialValue || '')}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                        <button
                                            onClick={() => setModalConfig(null)}
                                            style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: 'transparent', color: '#5f6368', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button
                                            onClick={() => handleAction(modalConfig.type, modalConfig.board, document.getElementById('modal-input').value)}
                                            style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#1a73e8', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            {t('confirm')}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )
            }

            {/* Context Menu */}
            {
                contextMenu && (
                    <div
                        style={{
                            position: 'fixed', top: contextMenu.y + 10, left: contextMenu.x - 100,
                            background: 'white', padding: 8, borderRadius: 12,
                            boxShadow: '0 5px 20px rgba(0,0,0,0.15)', zIndex: 900,
                            display: 'flex', flexDirection: 'column', minWidth: 160,
                            border: '1px solid rgba(0,0,0,0.05)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => { setModalConfig({ type: 'rename', title: 'Rename Board', initialValue: contextMenu.board.title, board: contextMenu.board }); setContextMenu(null) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 15px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: '0.9rem', color: '#333' }}
                            onMouseEnter={e => e.target.style.background = '#f5f5f5'} onMouseLeave={e => e.target.style.background = 'transparent'}
                        >
                            <FiEdit2 /> Rename
                        </button>
                        <button
                            onClick={() => { setModalConfig({ type: 'move', title: 'Move to Folder', initialValue: contextMenu.board.folder, board: contextMenu.board }); setContextMenu(null) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 15px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: '0.9rem', color: '#333' }}
                            onMouseEnter={e => e.target.style.background = '#f5f5f5'} onMouseLeave={e => e.target.style.background = 'transparent'}
                        >
                            <FiMove /> Move to Folder
                        </button>
                        <div style={{ height: 1, background: '#eee', margin: '5px 0' }} />
                        <button
                            onClick={() => { handleAction('delete', contextMenu.board); setContextMenu(null) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 15px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: '0.9rem', color: '#d93025' }}
                            onMouseEnter={e => e.target.style.background = '#fff0f0'} onMouseLeave={e => e.target.style.background = 'transparent'}
                        >
                            <FiTrash2 /> Delete
                        </button>
                    </div>
                )
            }
        </div >
    )
}


