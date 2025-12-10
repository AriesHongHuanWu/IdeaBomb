import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import BoardPage from './components/BoardPage'
import AdminPage from './components/AdminPage'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'

import LandingPage from './components/LandingPage'
import TermsOfService from './components/TermsOfService'
import PrivacyPolicy from './components/PrivacyPolicy'
import GuidePage from './components/GuidePage'

function App() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u)
            setLoading(false)
        })
        return unsubscribe
    }, [])

    if (loading) {
        return (
            <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh',
                background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
                color: '#333'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        style={{
                            width: 50, height: 50,
                            borderRadius: '50%',
                            border: '4px solid rgba(0, 242, 254, 0.2)',
                            borderTop: '4px solid #00f2fe',
                        }}
                    />
                    <motion.p
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.2rem', fontWeight: 500, background: 'linear-gradient(to right, #4facfe, #00f2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                    >
                        Loading IdeaBomb...
                    </motion.p>
                </div>
            </div>
        )
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage user={user} />} />
                <Route path="/guide" element={<GuidePage />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />

                {/* Auth Routes */}
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
                <Route path="/board/:boardId" element={user ? <BoardPage user={user} /> : <Navigate to="/login" />} />
                <Route path="/admin" element={user ? <AdminPage user={user} /> : <Navigate to="/login" />} />

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
