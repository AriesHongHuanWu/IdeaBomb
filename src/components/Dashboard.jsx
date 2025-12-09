import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore'
import { FiPlus, FiLogOut, FiLayout, FiHome, FiFolder, FiUsers, FiGrid, FiShare2, FiClock, FiMoreVertical } from 'react-icons/fi'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { updateDoc, doc } from 'firebase/firestore'

export default function Dashboard({ user }) {
    const [boards, setBoards] = useState([])
    const navigate = useNavigate()
    const [activeView, setActiveView] = useState('all')
    const [selectedFolder, setSelectedFolder] = useState(null)
    const isMobile = useMediaQuery('(max-width: 768px)')

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
        return () => unsubscribe()
    }, [user])

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

    const moveToFolder = async (boardId, folderName) => {
        try {
            const boardRef = doc(db, 'boards', boardId);
            await updateDoc(boardRef, {
                folder: folderName === '' ? null : folderName // Set to null if empty string
            });
        } catch (e) {
            console.error("Error moving board to folder:", e);
            alert("Error moving board: " + e.message);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: '"Google Sans", "Inter", sans-serif', overflowX: 'hidden' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', background: 'white', borderBottom: '1px solid #dadce0' }}>
                <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                    <FiLayout /> IdeaBomb
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
                    <NavItem icon={<FiGrid />} label="All Boards" active={activeView === 'all'} onClick={() => { setActiveView('all'); setSelectedFolder(null) }} isMobile={isMobile} />
                    <NavItem icon={<FiLayout />} label="My Boards" active={activeView === 'created'} onClick={() => { setActiveView('created'); setSelectedFolder(null) }} isMobile={isMobile} />
                    <NavItem icon={<FiShare2 />} label="Shared with me" active={activeView === 'shared'} onClick={() => { setActiveView('shared'); setSelectedFolder(null) }} isMobile={isMobile} />

                    <div style={{ margin: '20px 0', borderTop: '1px solid #eee' }}></div>

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
                <div style={{ flex: 1, padding: isMobile ? '20px' : 40 }}>
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
                                            <div onClick={(e) => {
                                                e.stopPropagation();
                                                const newFolder = prompt("Enter folder name:", board.folder || "");
                                                if (newFolder !== null) moveToFolder(board.id, newFolder);
                                            }} style={{ cursor: 'pointer', padding: 4, borderRadius: '50%', color: '#5f6368' }}>
                                                <FiMoreVertical />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginTop: 10, fontSize: '0.8rem', color: '#5f6368' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Collaborators">
                                                <FiUsers /> {board.allowedEmails?.length || 1}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Created Date">
                                                <FiClock /> {board.createdAt?.toDate ? new Date(board.createdAt).toLocaleDateString() : 'Just now'}
                                            </div>
                                        </div>

                                        {board.ownerId !== user.uid && (
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
            </div>
        </div>
    )
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
