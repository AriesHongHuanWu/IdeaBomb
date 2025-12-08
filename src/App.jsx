import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import BoardPage from './components/BoardPage'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'

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
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>
    }

    if (!user) {
        return <Login />
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/board/:boardId" element={<BoardPage user={user} />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
