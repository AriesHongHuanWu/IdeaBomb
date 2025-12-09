import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore'
import { FiPlus, FiLogOut, FiLayout, FiHome } from 'react-icons/fi'
import { useMediaQuery } from '../hooks/useMediaQuery'

export default function Dashboard({ user }) {
    const [boards, setBoards] = useState([])
    const navigate = useNavigate()
    const isMobile = useMediaQuery('(max-width: 768px)')

    useEffect(() => {
        document.title = 'Dashboard - IdeaBomb'
    }, [])

    useEffect(() => {
        if (!user) return

        const q = query(
            collection(db, "boards"),
            where("allowedEmails", "array-contains", user.email)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const boardsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            boardsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
            setBoards(boardsData)
        })

        return () => unsubscribe()
    }, [user])

    const createBoard = async () => {
        try {
            const docRef = await addDoc(collection(db, "boards"), {
                createdAt: new Date(),
                ownerId: user.uid,
                ownerEmail: user.email,
                allowedEmails: [user.email],
                elements: [],
                title: "Untitled Board"
            })
            navigate(`/board/${docRef.id}`)
        } catch (error) {
            console.error("Error creating board: ", error)
            alert("Failed to create board")
        }
    }

    const handleLogout = async () => {
        await signOut(auth)
        navigate('/')
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: '"Google Sans", "Inter", sans-serif' }}>
            {/* Navbar */}
            <nav style={{
                padding: isMobile ? '15px 20px' : '15px 40px', background: 'white', borderBottom: '1px solid #dadce0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 'bold', fontSize: '1.2rem', color: '#5f6368', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <FiLayout /> IdeaBomb Dashboard
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <span style={{ color: '#5f6368', fontSize: '0.9rem', display: isMobile ? 'none' : 'block' }}>{user?.email}</span>
                    <button onClick={handleLogout} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#5f6368', fontSize: '1.2rem' }} title="Sign Out">
                        <FiLogOut />
                    </button>
                </div>
            </nav>

            <div style={{ padding: isMobile ? '20px' : 40, maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                    <h1 style={{ fontSize: '1.8rem', margin: 0 }}>My Boards</h1>
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

                {boards.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: 80, color: '#5f6368' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 20, opacity: 0.2 }}><FiLayout /></div>
                        <p>No boards yet. Create one to get started!</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 20
                    }}>
                        {boards.map(board => (
                            <motion.div
                                key={board.id}
                                layoutId={board.id}
                                whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                                onClick={() => navigate(`/board/${board.id}`)}
                                style={{
                                    background: 'white', borderRadius: 8, border: '1px solid #dadce0',
                                    overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s'
                                }}
                            >
                                <div style={{ height: 140, background: '#f1f3f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bdc1c6' }}>
                                    <FiLayout style={{ fontSize: '3rem', opacity: 0.5 }} />
                                </div>
                                <div style={{ padding: 15 }}>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#202124' }}>{board.title || 'Untitled Board'}</h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#5f6368' }}>
                                        Created {board.createdAt?.toDate ? board.createdAt.toDate().toLocaleDateString() : new Date(board.createdAt || Date.now()).toLocaleDateString()}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
