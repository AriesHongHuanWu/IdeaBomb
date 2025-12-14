import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiUserPlus, FiMail, FiCheck, FiMoreHorizontal, FiTrash2, FiUser } from 'react-icons/fi'
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useSettings } from '../App'

export default function ShareModal({ boardId, isOpen, onClose, user }) {
    const { theme, t } = useSettings()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)
    const [collaborators, setCollaborators] = useState([])
    const [ownerId, setOwnerId] = useState(null)
    const [showCopiedTooltip, setShowCopiedTooltip] = useState(false)

    // Real-time subscription to board data
    useEffect(() => {
        if (!boardId || !isOpen) return

        const unsub = onSnapshot(doc(db, 'boards', boardId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()
                setOwnerId(data.ownerId)

                // Build collaborator list
                const peeps = []

                // Add Owner if known (assuming owner details are stored or implied)
                // Since we only have ownerId usually, we might not have email unless stored.
                // Checking if 'editors' and 'viewers' contain emails.

                // Map existing arrays to objects
                const editors = data.editors || []
                const viewers = data.viewers || []

                editors.forEach(e => peeps.push({ email: e, role: 'editor' }))
                viewers.forEach(e => peeps.push({ email: e, role: 'viewer' }))

                // Deduplicate by email
                const uniquePeeps = Array.from(new Map(peeps.map(p => [p.email, p])).values())
                setCollaborators(uniquePeeps)
            }
        })

        return () => unsub()
    }, [boardId, isOpen])

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setShowCopiedTooltip(true)
        setTimeout(() => {
            setCopied(false)
            setShowCopiedTooltip(false)
        }, 2000)
    }

    const handleInvite = async (e) => {
        e.preventDefault()
        if (!email.trim() || !boardId) return
        setLoading(true)
        const emailToInvite = email.trim().toLowerCase()
        const role = document.getElementById('role-select').value

        try {
            const updates = {
                allowedEmails: arrayUnion(emailToInvite)
            }

            // Update Firestore Permissions
            if (role === 'editor') {
                updates.editors = arrayUnion(emailToInvite)
                updates.viewers = arrayRemove(emailToInvite)
            } else {
                updates.viewers = arrayUnion(emailToInvite)
                updates.editors = arrayRemove(emailToInvite)
            }

            await updateDoc(doc(db, 'boards', boardId), updates)

            // API Call (No Alert)
            fetch('/api/send-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    toEmail: emailToInvite,
                    role: role,
                    link: window.location.href,
                    inviterName: user?.displayName || 'An IdeaBomb User'
                })
            }).catch(console.error)

            setEmail('')
        } catch (error) {
            console.error("Invite failed", error)
            alert("Failed: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const changeRole = async (targetEmail, newRole) => {
        try {
            const updates = {}
            if (newRole === 'remove') {
                updates.editors = arrayRemove(targetEmail)
                updates.viewers = arrayRemove(targetEmail)
                updates.allowedEmails = arrayRemove(targetEmail)
            } else if (newRole === 'editor') {
                updates.editors = arrayUnion(targetEmail)
                updates.viewers = arrayRemove(targetEmail)
            } else {
                updates.viewers = arrayUnion(targetEmail)
                updates.editors = arrayRemove(targetEmail)
            }
            await updateDoc(doc(db, 'boards', boardId), updates)
        } catch (err) {
            console.error("Failed to update role", err)
        }
    }

    if (!isOpen) return null

    // Determine current user's permission to manage others
    // Only owner should manage permissions (usually). 
    // If ownerId is missing, assume open for all (development) or strictly check user.uid
    const canManage = user?.uid === ownerId || !ownerId // specific logic depends on requirement

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                style={{
                    background: theme?.modalBg || 'white',
                    borderRadius: 16,
                    width: 500,
                    maxWidth: '95vw',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    position: 'relative',
                    color: theme?.text,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>

                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme?.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ background: '#e0f2fe', padding: 8, borderRadius: '50%', color: '#0284c7', display: 'flex' }}><FiUserPlus /></div>
                        {t('share')} "{t('untitled')}"
                    </h2>
                    <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme?.text, padding: 8, borderRadius: 8 }} hover={{ background: theme?.activeBg }}><FiX size={20} /></button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px' }}>
                    {/* Invite Input */}
                    <form onSubmit={handleInvite} style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    type="email"
                                    placeholder="Add people, groups, or emails"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: 8,
                                        border: `1px solid ${theme?.border || '#ccc'}`,
                                        background: theme?.inputBg || 'white',
                                        color: theme?.text,
                                        fontSize: '1rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <select id="role-select" style={{
                                    height: '100%',
                                    padding: '0 36px 0 16px',
                                    borderRadius: 8,
                                    border: `1px solid ${theme?.border || '#ccc'}`,
                                    background: theme?.bg || 'white',
                                    appearance: 'none',
                                    cursor: 'pointer',
                                    color: theme?.text,
                                    fontWeight: 500
                                }}>
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10 }}>▼</div>
                            </div>
                            <button disabled={!email || loading} type="submit" style={{
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                padding: '0 20px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                opacity: (!email || loading) ? 0.5 : 1
                            }}>
                                {loading ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </form>

                    {/* Collaborators List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>People with access</h3>

                        {/* Owner Section (Hardcoded/Deduced) */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    {user?.displayName ? user.displayName[0].toUpperCase() : <FiUser />}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{user?.displayName || 'You'} (Owner)</span>
                                    <span style={{ fontSize: '0.85rem', color: theme?.text, opacity: 0.6 }}>{user?.email}</span>
                                </div>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>Owner</span>
                        </div>

                        {/* Collaborators */}
                        {collaborators.filter(c => c.email !== user?.email).map((collab) => (
                            <div key={collab.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#cbd5e1', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                        {collab.email[0].toUpperCase()}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{collab.email.split('@')[0]}</span>
                                        <span style={{ fontSize: '0.85rem', color: theme?.text, opacity: 0.6 }}>{collab.email}</span>
                                    </div>
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <select
                                        value={collab.role}
                                        onChange={(e) => changeRole(collab.email, e.target.value)}
                                        style={{
                                            padding: '6px 24px 6px 10px',
                                            borderRadius: 6,
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            color: theme?.text,
                                            fontWeight: 500,
                                            textAlign: 'right',
                                            appearance: 'none'
                                        }}
                                        disabled={!canManage}
                                    >
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Viewer</option>
                                        <option value="remove">Remove Access</option>
                                    </select>
                                    {/* Custom caret replacement just for visual flair if needed, but native select is robust */}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer with Link Copy */}
                <div style={{ padding: '20px 24px', background: theme?.activeBg || '#f8fafc', borderTop: `1px solid ${theme?.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }} onClick={copyLink}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 16 }}>🔗</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.9rem' }}>{t('copyLink')}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b' }}>Anyone with link can view</span>
                        </div>
                    </div>

                    {showCopiedTooltip && (
                        <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiCheck /> {t('copied')}
                        </motion.span>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
