import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import { collection, addDoc, query, where, onSnapshot, setDoc } from 'firebase/firestore'
import { FiPlus, FiLogOut, FiLayout, FiHome, FiFolder, FiUsers, FiGrid, FiShare2, FiClock, FiMoreVertical, FiEdit2, FiTrash2, FiMove, FiShield, FiGlobe, FiCheckSquare } from 'react-icons/fi'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { updateDoc, doc, deleteDoc } from 'firebase/firestore'
import TodoView from './TodoView'

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
    const isMobile = useMediaQuery('(max-width: 768px)')

    // Modal State
    const [modalConfig, setModalConfig] = useState(null) // { type: 'create_folder' | 'rename_board' | 'move_board', title: string, initialValue: string, onConfirm: (val) => void }
    const [contextMenu, setContextMenu] = useState(null) // { x, y, boardId }

    useEffect(() => {
        if (!user) return
        // Query: Boards owner created OR is invited to (allowedEmails contains my email)
        // To support both efficiently without composite index issues immediately, 
        // we'll just check 'allowedEmails' array-contains user.email.
        // (Assuming creating a board adds owner to allowedEmails)

        const q = query(
            collection(db, 'boards'),
            where('allowedEmails', 'array-contains', user.email)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setBoards(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        }, (error) => {
            console.error("Dashboard Query Error:", error)
        })

        // Sync User to Firestore (for Admin Discovery)
        setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: new Date().toISOString()
        }, { merge: true }).catch(err => console.error("User Sync Error", err))

        return () => unsubscribe()
    }, [user])

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
        switch (activeView) {
            case 'shared':
                return boards.filter(b => b.ownerId !== user.uid)
            case 'created':
                return boards.filter(b => b.ownerId === user.uid)
            case 'folder':
                return boards.filter(b => b.folder === selectedFolder)
            case 'all':
            default:
                return boards
        }
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
                    title: 'Delete Board?',
                    message: 'Are you sure you want to delete this board? This action cannot be undone.',
                    onConfirm: async () => {
                        await deleteDoc(boardRef)
                        setModalConfig(null)
                    }
                })
                return // Don't close modal immediately for delete
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
        <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: '"Google Sans", "Inter", sans-serif', overflowX: 'hidden' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', background: 'white', borderBottom: '1px solid #dadce0' }}>
                <h1 onClick={() => navigate('/')} style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 10, margin: 0, cursor: 'pointer' }}>
                    <img src="/logo.svg" alt="Logo" style={{ height: 24 }} /> IdeaBomb
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {user && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={user.photoURL} alt="User" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                            <span>{user.displayName}</span>
                        </div>
                    )}
                    <button onClick={() => signOut(auth)} style={{ background: 'white', border: '1px solid #ddd', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <FiLogOut /> Sign Out
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }}>

                {/* Sidebar */}
                <div style={{
                    width: isMobile ? '60px' : '250px',
                    background: 'white',
                    borderRight: '1px solid #dadce0',
                    padding: '20px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0
                }}>
                    <NavItem icon={<FiGlobe />} label="Home Page" active={false} onClick={() => navigate('/home')} isMobile={isMobile} />
                    <NavItem icon={<FiGrid />} label="All Boards" active={activeView === 'all'} onClick={() => { setActiveView('all'); setSelectedFolder(null) }} isMobile={isMobile} />
                    <NavItem icon={<FiLayout />} label="My Boards" active={activeView === 'created'} onClick={() => { setActiveView('created'); setSelectedFolder(null) }} isMobile={isMobile} />
                    <NavItem icon={<FiShare2 />} label="Shared with me" active={activeView === 'shared'} onClick={() => { setActiveView('shared'); setSelectedFolder(null) }} isMobile={isMobile} />
                    <NavItem icon={<FiCheckSquare />} label="TODO" active={activeView === 'todo'} onClick={() => { setActiveView('todo'); setSelectedFolder(null) }} isMobile={isMobile} />

                    {/* Admin Link */}
                    {['aries0d0f@gmail.com', 'aries.wu@ideabomb.com', 'arieswu001@gmail.com'].includes(user?.email?.toLowerCase()) && (
                        <NavItem icon={<FiShield />} label="Admin Console" active={false} onClick={() => navigate('/admin')} isMobile={isMobile} />
                    )}

                    <div style={{ margin: '10px 0', borderTop: '1px solid #eee' }}></div>

                    {!isMobile && (
                        <div style={{ padding: '0 20px', marginBottom: 10, fontSize: '0.8rem', fontWeight: 'bold', color: '#5f6368' }}>
                            FOLDERS
                        </div>
                    )}

                    {folders.map(folder => (
                        <NavItem
                            key={folder}
                            icon={<FiFolder />}
                            label={folder}
                            active={activeView === 'folder' && selectedFolder === folder}
                            onClick={() => { setActiveView('folder'); setSelectedFolder(folder) }}
                            isMobile={isMobile}
                        />
                    ))}
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, padding: isMobile ? '20px' : 40, height: '100%', overflow: 'hidden' }}>

                    {activeView === 'todo' ? (
                        <div style={{ height: '100%' }}>
                            <TodoView user={user} />
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                                <h1 style={{ fontSize: '1.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {activeView === 'folder' ? <><FiFolder /> {selectedFolder}</> :
                                        activeView === 'shared' ? <><FiShare2 /> Shared with me</> :
                                            activeView === 'created' ? <><FiLayout /> My Boards</> :
                                                <><FiGrid /> All Boards</>}
                                </h1>
                                <button
                                    onClick={createBoard}
                                    style={{
                                        padding: '10px 20px', background: '#1a73e8', color: 'white', border: 'none',
                                        borderRadius: 4, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <FiPlus /> New Board
                                </button>
                            </div>

                            {filteredBoards.length === 0 ? (
                                <div style={{ textAlign: 'center', marginTop: 80, color: '#5f6368' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: 20, opacity: 0.2 }}><FiLayout /></div>
                                    <p>No boards found in this view.</p>
                                </div>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                    gap: 20
                                }}>
                                    {filteredBoards.map(board => (
                                        <motion.div
                                            key={board.id}
                                            layoutId={board.id}
                                            whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                                            onClick={() => navigate(`/board/${board.id}`)}
                                            style={{
                                                background: 'white', borderRadius: 8, border: '1px solid #dadce0',
                                                overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s',
                                                position: 'relative'
                                            }}
                                        >
                                            {/* Preview Area */}
                                            <div style={{ height: 140, background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #eee', position: 'relative' }}>
                                                {board.thumbnail ? (
                                                    <img src={board.thumbnail} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ opacity: 0.1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        <FiLayout style={{ fontSize: '3rem' }} />
                                                    </div>
                                                )}
                                                {/* Folder Badge */}
                                                {board.folder && (
                                                    <div style={{
                                                        position: 'absolute', top: 10, left: 10,
                                                        background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 12,
                                                        fontSize: '0.75rem', color: '#5f6368', display: 'flex', alignItems: 'center', gap: 4
                                                    }}>
                                                        <FiFolder size={12} /> {board.folder}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info Area */}
                                            <div style={{ padding: 15 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#202124', fontWeight: 500 }}>
                                                        {board.title || 'Untitled Board'}
                                                    </h3>
                                                    <div
                                                        onClick={(e) => openContextMenu(e, board)}
                                                        style={{ cursor: 'pointer', padding: 6, borderRadius: '50%', color: '#5f6368', marginRight: -5 }}
                                                        onMouseEnter={e => e.target.style.background = 'rgba(0,0,0,0.05)'}
                                                        onMouseLeave={e => e.target.style.background = 'transparent'}
                                                    >
                                                        <FiMoreVertical />
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginTop: 10, fontSize: '0.8rem', color: '#5f6368' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Collaborators">
                                                        <FiUsers /> {board.allowedEmails?.length || 1}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Last Active">
                                                        <FiClock /> {formatDate(board.createdAt)}
                                                    </div>
                                                </div>

                                                {(board.createdBy !== user.uid && board.ownerEmail !== user.email) && (
                                                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#1a73e8', background: '#e8f0fe', display: 'inline-block', padding: '2px 6px', borderRadius: 4 }}>
                                                        Shared by {board.ownerEmail}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal System */}
            {modalConfig && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'white', padding: 30, borderRadius: 24,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '90%', maxWidth: 400,
                            border: '1px solid rgba(0,0,0,0.05)'
                        }}
                    >
                        {modalConfig.type === 'confirm' ? (
                            <>
                                <h2 style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>{modalConfig.title}</h2>
                                <p style={{ color: '#666', marginBottom: 25, lineHeight: 1.5 }}>{modalConfig.message}</p>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                    <button onClick={() => setModalConfig(null)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'transparent', color: '#666', cursor: 'pointer' }}>Cancel</button>
                                    <button onClick={() => handleAction(modalConfig.type, modalConfig.board, document.getElementById('modal-input').value)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#1a73e8', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Confirm</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 style={{ margin: '0 0 20px 0', fontSize: '1.4rem' }}>{modalConfig.title}</h2>
                                <input
                                    autoFocus
                                    id="modal-input"
                                    defaultValue={modalConfig.initialValue}
                                    placeholder="Type here..."
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
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleAction(modalConfig.type, modalConfig.board, document.getElementById('modal-input').value)}
                                        style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#1a73e8', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
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
            )}
        </div>
    )
}


