import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import { collection, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { FiPlus, FiLogOut, FiLayout } from 'react-icons/fi'

export default function Dashboard({ user }) {
    const [boards, setBoards] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        if (!user) return
        // Simple query: Boards created by me. (Future: Shared with me)
        const q = query(
            collection(db, 'boards'),
            where('createdBy', '==', user.uid)
            // orderBy requires index, skipping for now or catching error
        )
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setBoards(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        })
        return unsubscribe
    }, [user])

    const createBoard = async () => {
        try {
            const docRef = await addDoc(collection(db, 'boards'), {
                title: 'Untitled Board',
                createdBy: user.uid,
                createdAt: new Date().toISOString(),
                members: [user.uid]
            })
            navigate(`/board/${docRef.id}`)
        } catch (e) {
            console.error("Error creating board", e)
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: 40 }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 60 }}>
                <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FiLayout /> IdeaBomb Dashboard
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={user.photoURL} alt="User" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                        <span>{user.displayName}</span>
                    </div>
                    <button onClick={() => signOut(auth)} style={{ background: 'white', border: '1px solid #ddd', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <FiLogOut /> Sign Out
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 30 }}>
                {/* Create New Card */}
                <motion.button
                    whileHover={{ scale: 1.02, y: -5 }}
                    onClick={createBoard}
                    style={{
                        height: 200, border: 'none', background: 'var(--primary)', color: 'white',
                        borderRadius: 24, cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 20,
                        boxShadow: '0 10px 30px rgba(26, 115, 232, 0.3)'
                    }}
                >
                    <div style={{ padding: 20, background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}>
                        <FiPlus size={40} />
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Create New Board</span>
                </motion.button>

                {/* Existing Boards */}
                {boards.map(board => (
                    <motion.div
                        key={board.id}
                        whileHover={{ scale: 1.02, y: -5 }}
                        onClick={() => navigate(`/board/${board.id}`)}
                        style={{
                            height: 200, background: 'white', borderRadius: 24, padding: 30,
                            cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{board.title}</h3>
                        <div style={{ color: '#888', fontSize: '0.9rem' }}>
                            Created: {new Date(board.createdAt).toLocaleDateString()}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
