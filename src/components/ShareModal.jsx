import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiUserPlus, FiMail } from 'react-icons/fi'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'

export default function ShareModal({ boardId, isOpen, onClose }) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

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
            const subject = encodeURIComponent("You're invited to my Whiteboard")
            const body = encodeURIComponent(`Hi,\n\nI've invited you to collaborate on my whiteboard. Please log in with this Google Email (${email}) to access it.\n\nLink: ${window.location.href}\n\nThanks!`)

            if (window.confirm(`User ${email} has been given access!\n\nDo you want to open your email app to send them the link now?`)) {
                window.open(`mailto:${email}?subject=${subject}&body=${body}`)
            }

            setEmail('')
            onClose()
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
                    <FiUserPlus /> Invite Members
                </h2>
                <p style={{ color: '#666', lineHeight: '1.5' }}>
                    Enter the email address of the person you want to invite. They must sign in with Google using this email.
                </p>

                <form onSubmit={handleInvite} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 15 }}>
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
                        {loading ? 'Sending...' : 'Send Invite'}
                    </button>
                </form>
            </motion.div>
        </div>
    )
}
