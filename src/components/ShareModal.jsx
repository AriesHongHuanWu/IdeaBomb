import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FiX, FiUserPlus, FiMail } from 'react-icons/fi'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'
import emailjs from '@emailjs/browser'
import { useSettings } from '../App'

export default function ShareModal({ boardId, isOpen, onClose, user }) {
    const { theme, t } = useSettings()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const copyLink = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) }

    const handleInvite = async (e) => {
        e.preventDefault()
        if (!email.trim() || !boardId) return
        setLoading(true)
        const emailToInvite = email.trim().toLowerCase()
        const role = document.getElementById('role-select').value

        try {
            const updates = {
                allowedEmails: arrayUnion(emailToInvite) // Always add to allow list
            }

            // Manage Role Arrays: Add to one, remove from other to ensure single role
            if (role === 'editor') {
                updates.editors = arrayUnion(emailToInvite)
                updates.viewers = arrayRemove(emailToInvite)
            } else {
                updates.viewers = arrayUnion(emailToInvite)
                updates.editors = arrayRemove(emailToInvite)
            }

            await updateDoc(doc(db, 'boards', boardId), updates)

            // --- EmailJS Logic ---
            const SERVICE_ID = 'awbestmail'
            const TEMPLATE_ID = 'ideabombinvite'
            const PUBLIC_KEY = '-jg3wr8AP773h-fFD'

            try {
                await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
                    to_email: emailToInvite,
                    to_name: emailToInvite.split('@')[0],
                    role: role,
                    link: window.location.href,
                    invite_sender: user?.displayName || 'An IdeaBomb User'
                }, PUBLIC_KEY)

                alert(`Official invitation sent to ${emailToInvite}!`)
            } catch (err) {
                // Fallback if EmailJS fails (e.g. quota exceeded)
                console.error("EmailJS Error:", err)
                alert("Automated email failed (quota exceeded?), opening default mail app...")
                const subject = encodeURIComponent("Invitation: Collaborate on Whiteboard")
                const body = encodeURIComponent(`Hi,\n\nI've invited you as a ${role.toUpperCase()} to my whiteboard.\n\nBoard Link: ${window.location.href}\n\nPlease log in with: ${emailToInvite}\n\nThanks!`)
                window.location.href = `mailto:${emailToInvite}?subject=${subject}&body=${body}`
            }

            setEmail('')
        } catch (error) {
            console.error("Invite failed", error)
            alert("Failed to invite: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: theme?.modalBg || 'white', padding: 40, borderRadius: 24, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative', color: theme?.text }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: theme?.text }}><FiX /></button>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 0 }}><FiUserPlus /> {t('invite') || 'Share Board'}</h2>
                <p style={{ color: theme?.text || '#666', lineHeight: '1.5', fontSize: '0.9rem', opacity: 0.8 }}>Invite collaborators by email (must use Google Login).</p>
                <div style={{ background: theme?.bg || '#f5f5f5', padding: 10, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <span style={{ fontSize: '0.8rem', color: theme?.text || '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{window.location.href}</span>
                    <button onClick={copyLink} style={{ border: 'none', background: copied ? '#4caf50' : (theme?.cardBg || 'white'), color: copied ? 'white' : (theme?.text || '#333'), padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', border: `1px solid ${theme?.border}` }}>{copied ? 'Copied!' : 'Copy Link'}</button>
                </div>
                <div style={{ borderBottom: `1px solid ${theme?.border || '#eee'}`, marginBottom: 20 }}></div>
                <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <FiMail style={{ position: 'absolute', left: 15, top: 14, color: '#888' }} />
                            <input
                                type="email"
                                placeholder="friend@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 12, border: `1px solid ${theme?.border || '#ddd'}`, fontSize: '1rem', outline: 'none', boxSizing: 'border-box', background: theme?.bg || 'white', color: theme?.text }}
                                required
                            />
                        </div>
                        <select
                            id="role-select"
                            style={{ padding: '0 15px', borderRadius: 12, border: `1px solid ${theme?.border || '#ddd'}`, background: theme?.bg || 'white', fontSize: '0.9rem', cursor: 'pointer', color: theme?.text }}
                        >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading} style={{ padding: '12px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Granting Access...' : 'Share'}</button>
                    <p style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', margin: 0 }}>We use your default email app to send the invite link.</p>
                </form>
            </motion.div>
        </div>
    )
}
