import React from 'react'
import { motion } from 'framer-motion'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { FiMonitor, FiArrowLeft } from 'react-icons/fi'

export default function Login() {
    const navigate = useNavigate()

    React.useEffect(() => {
        document.title = 'Login - IdeaBomb'
    }, [])

    const handleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider)
            const { getAdditionalUserInfo } = await import('firebase/auth') // Import conditionally or move up
            const { doc, setDoc, increment, updateDoc, getDoc } = await import('firebase/firestore')
            const { db } = await import('../firebase')

            const details = getAdditionalUserInfo(result)
            if (details?.isNewUser) {
                const statsRef = doc(db, 'system', 'stats')
                // Use setDoc with merge to ensure doc exists, or update if exists
                // Safe increment pattern
                try {
                    await updateDoc(statsRef, { userCount: increment(1) })
                } catch (e) {
                    // Doc might not exist yet
                    await setDoc(statsRef, { userCount: 1 }, { merge: true })
                }
            }
        } catch (error) {
            console.error("Login failed", error)
            alert("Login failed: " + error.message)
        }
    }

    return (
        <div style={{
            width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#f8f9fa', position: 'relative'
        }}>
            <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 40, left: 40, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#5f6368', fontSize: '1rem' }}>
                <FiArrowLeft /> Back to Home
            </button>
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel"
                style={{
                    padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
                    background: 'rgba(255,255,255,0.8)', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                    maxWidth: '90%'
                }}
            >
                <div style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: 10 }}>
                    <FiMonitor />
                </div>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Welcome to IdeaBomb</h1>
                <p style={{ color: '#666', marginBottom: 20 }}>Collaborative Whiteboard for Teams</p>

                <button
                    onClick={handleLogin}
                    style={{
                        padding: '12px 30px', border: 'none', borderRadius: 50,
                        background: 'var(--primary)', color: 'white', fontSize: '1rem', fontWeight: 600,
                        cursor: 'pointer', boxShadow: '0 5px 15px rgba(26, 115, 232, 0.3)',
                        display: 'flex', alignItems: 'center', gap: 10
                    }}
                >
                    Sign in with Google
                </button>
            </motion.div>
        </div>
    )
}
