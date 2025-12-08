import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiUserPlus, FiMail } from 'react-icons/fi'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'

export default function ShareModal({ boardId, isOpen, onClose }) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleInvite = async (e) => {
        e.preventDefault()
        if (!email.trim() || !boardId) return

        setLoading(true)
        try {
            // Add email to allowedEmails array in board document
            const boardRef = doc(db, 'boards', boardId)
            await updateDoc(boardRef, {
                allowedEmails: arrayUnion(email.trim())
            })

            // Create mailto link
            const subject = encodeURIComponent("Invitation: Collaborate on Whiteboard")
            const body = encodeURIComponent(`Hi,\n\nI've enabled access for you on my whiteboard. Please log in with this Google Email (${email}).\n\nLink: ${window.location.href}\n\nThanks!`)

            // Open user's email client
            window.location.href = `mailto:${email}?subject=${subject}&body=${body}`

            alert(`Access granted to ${email}. Check your email app to send the link!`)
            setEmail('')
            // Don't close immediately so they can copy link if needed
        } catch (error) {
            console.error("Invite failed", error)
            alert("Failed to invite: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)'
        }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{
                    background: 'white', padding: 40, borderRadius: 24, width: 400,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative'
                }}
            >
                <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                    <FiX />
                </button>

                <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 0 }}>
                    <FiUserPlus /> Share Board
                </h2>
                <p style={{ color: '#666', lineHeight: '1.5', fontSize: '0.9rem' }}>
                    Invite collaborators by email (must use Google Login).
                </p>

                {/* Copy Link Section */}
                <div style={{ background: '#f5f5f5', padding: 10, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <span style={{ fontSize: '0.8rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                        {window.location.href}
                    </span>
                    <button onClick={copyLink} style={{ border: 'none', background: copied ? '#4caf50' : 'white', color: copied ? 'white' : '#333', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                </div>

                <div style={{ borderBottom: '1px solid #eee', marginBottom: 20 }}></div>

                <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    <div style={{ position: 'relative' }}>
                        <FiMail style={{ position: 'absolute', left: 15, top: 14, color: '#888' }} />
                        <input
                            type="email"
                            placeholder="friend@example.com" value={email} onChange={e => setEmail(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 12px 12px 40px', borderRadius: 12,
                                border: '1px solid #ddd', fontSize: '1rem', outline: 'none', boxSizing: 'border-box'
                            }}
                            required
                        />
                    </div>

                    <button
                        type="submit" disabled={loading}
                        style={{
                            padding: '12px', borderRadius: 12, border: 'none',
                            background: 'var(--primary)', color: 'white', fontWeight: 600,
                            cursor: 'pointer', opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Granting Access...' : 'Grant Access & Send Email'}
                    </button>
                    <p style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', margin: 0 }}>
                        We use your default email app to send the invite link.
                    </p>
                </form>
            </motion.div>
        </div>
    )
}
