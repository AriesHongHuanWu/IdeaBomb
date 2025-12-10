import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import BoardPage from './components/BoardPage'
import AdminPage from './components/AdminPage'
import LogoLoader from './components/LogoLoader'
import PageTransition from './components/PageTransition'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'

import LandingPage from './components/LandingPage'
import TermsOfService from './components/TermsOfService'
import PrivacyPolicy from './components/PrivacyPolicy'
import GuidePage from './components/GuidePage'

function App() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const location = useLocation()

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u)
            // Ensure loader shows for at least 1.5s
            setTimeout(() => {
                setLoading(false)
            }, 1500)
        })
        return unsubscribe
    }, [])

    if (loading) {
        return <LogoLoader />
    }

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageTransition><LandingPage user={user} /></PageTransition>} />
                <Route path="/guide" element={<PageTransition><GuidePage /></PageTransition>} />
                <Route path="/terms" element={<PageTransition><TermsOfService /></PageTransition>} />
                <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />

                {/* Auth Routes */}
                <Route path="/login" element={<PageTransition>{!user ? <Login /> : <Navigate to="/dashboard" />}</PageTransition>} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<PageTransition>{user ? <Dashboard user={user} /> : <Navigate to="/login" />}</PageTransition>} />
                <Route path="/board/:boardId" element={<PageTransition>{user ? <BoardPage user={user} /> : <Navigate to="/login" />}</PageTransition>} />
                <Route path="/admin" element={<PageTransition>{user ? <AdminPage user={user} /> : <Navigate to="/login" />}</PageTransition>} />

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </AnimatePresence>
    )
}

export default App
