import React, { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import BoardPage from './components/BoardPage'
import AdminPage from './components/AdminPage'
import LogoLoader from './components/LogoLoader'
import PageTransition from './components/PageTransition'
import CalendarPage from './components/CalendarPage'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'

import LandingPage from './components/LandingPage'
import TermsOfService from './components/TermsOfService'
import PrivacyPolicy from './components/PrivacyPolicy'
import GuidePage from './components/GuidePage'
import { translations, themeColors } from './utils/constants'

// Export Context for hook usage
export const SettingsContext = createContext()

// Hook for easy access
export const useSettings = () => useContext(SettingsContext)

function App() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const location = useLocation()

    // Global Settings State
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('app_settings')
        // Migration: check old key 'dashboard_settings' if new one missing
        const old = localStorage.getItem('dashboard_settings')
        if (!saved && old) return JSON.parse(old)

        return saved ? JSON.parse(saved) : { theme: 'light', lang: 'en' }
    })

    useEffect(() => {
        localStorage.setItem('app_settings', JSON.stringify(settings))
    }, [settings])

    const t = (key) => translations[settings.lang]?.[key] || key
    const theme = themeColors[settings.theme]

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

    const contextValue = { settings, setSettings, t, theme }

    return (
        <SettingsContext.Provider value={contextValue}>
            <div style={{ background: theme.bg, color: theme.text, minHeight: '100vh', transition: 'background 0.3s, color 0.3s' }}>
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<SmartRoot user={user} />} />
                        <Route path="/home" element={<PageTransition><LandingPage user={user} /></PageTransition>} />
                        <Route path="/guide" element={<PageTransition><GuidePage /></PageTransition>} />
                        <Route path="/terms" element={<PageTransition><TermsOfService /></PageTransition>} />
                        <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />

                        {/* Auth Routes */}
                        <Route path="/login" element={<PageTransition>{!user ? <Login /> : <Navigate to="/dashboard" />}</PageTransition>} />

                        {/* Protected Routes */}
                        <Route path="/dashboard" element={<PageTransition>{user ? <Dashboard user={user} /> : <Navigate to="/login" />}</PageTransition>} />
                        <Route path="/board/:boardId" element={<PageTransition>{user ? <BoardPage user={user} /> : <Navigate to="/login" />}</PageTransition>} />
                        <Route path="/admin" element={<PageTransition>{user ? <AdminPage user={user} /> : <Navigate to="/login" />}</PageTransition>} />
                        <Route path="/calendar" element={<PageTransition>{user ? <CalendarPage /> : <Navigate to="/login" />}</PageTransition>} />

                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </AnimatePresence>
            </div>
        </SettingsContext.Provider>
    )
}

const SmartRoot = ({ user }) => {
    if (user) return <Navigate to="/dashboard" replace />
    return <PageTransition><LandingPage user={user} /></PageTransition>
}

export default App
