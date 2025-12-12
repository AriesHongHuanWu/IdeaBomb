import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FiX, FiUserPlus, FiMail } from 'react-icons/fi'
import { doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function ShareModal({ boardId, isOpen, onClose }) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const [role, setRole] = useState('editor')

    const roleMap = {
        'editor': 'Editor',
        'viewer': 'Viewer'
    }

    const copyLink = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) }

    const handleInvite = async (e) => {
        e.preventDefault()
        if (!email.trim() || !boardId) return
        setLoading(true)
        const emailToInvite = email.trim().toLowerCase()
        const selectedRole = role
        try {
            // Encode email for map key if necessary, but dot notation works if key is just string.
            // Actually, map keys with dots are tricky. We should sanitize or just rely on 'roles' map.
            // Ideally we'd use array of objects [{email: x, role: y}] but map is faster lookup.
            // Let's assume standard emails. If we use updateDoc with "roles.email", dots in email (aries.wu) are interpreted as nested fields!
            // FIX: We must read, update object, write back OR use special FieldPath? FieldPath is safer.
            // For now, let's use merge setDoc on top level or just updateDoc with FieldPath.
            // EASIER SAFER WAY: Use `roles` map. But `updateDoc` "roles.a.b@gmail.com" treats it as roles -> a -> b@gmail.com.
            // WORKAROUND: We will replace dots in email with something else for the key? No, that's messy.
            // ALTERNATIVE: Just store `members` array of objects? No, searching is O(N).
            // BEST WAY: Use `updateDoc` with `new FieldPath('roles', emailToInvite)`.

            // However, since I can't easily import FieldPath right here without checking firebase imports...
            // Let's use the array approach for now? No, the plan said Map.
            // Let's try to grab current data and update. It's safer for "Don't crash".
            // Actually, `updateDoc` with `['roles.' + emailToInvite]` works in JS SDK if you wrap key in quotes? No.

            // Let's stick to simple: Read -> Modify -> Write is safest for consistency, but slightly slower.
            // Or `setDoc` with `{ roles: { [emailToInvite]: selectedRole } }` and merge: true.
            await setDoc(doc(db, 'boards', boardId), {
                allowedEmails: arrayUnion(emailToInvite),
                roles: { [emailToInvite]: selectedRole }
            }, { merge: true })

            const subject = encodeURIComponent("Invitation: Collaborate on Whiteboard")
            const body = encodeURIComponent(`Hi,\n\nI've invited you as a ${roleMap[selectedRole]} to my whiteboard. Please log in with this Google Email (${emailToInvite}).\n\nLink: ${window.location.href}\n\nThanks!`)
            window.location.href = `mailto:${emailToInvite}?subject=${subject}&body=${body}`
            alert(`Access granted to ${emailToInvite} as ${roleMap[selectedRole]}.`)
            setEmail('')
        } catch (error) { console.error("Invite failed", error); alert("Failed to invite: " + error.message) }
        finally { setLoading(false) }
    }

    if (!isOpen) return null

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', padding: 40, borderRadius: 24, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}><FiX /></button>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 0 }}><FiUserPlus /> Share Board</h2>
                <p style={{ color: '#666', lineHeight: '1.5', fontSize: '0.9rem' }}>Invite collaborators by email (must use Google Login).</p>
                <div style={{ background: '#f5f5f5', padding: 10, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <span style={{ fontSize: '0.8rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{window.location.href}</span>
                    <button onClick={copyLink} style={{ border: 'none', background: copied ? '#4caf50' : 'white', color: copied ? 'white' : '#333', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>{copied ? 'Copied!' : 'Copy Link'}</button>
                </div>
                <div style={{ borderBottom: '1px solid #eee', marginBottom: 20 }}></div>
                <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <FiMail style={{ position: 'absolute', left: 15, top: 14, color: '#888' }} />
                            <input type="email" placeholder="friend@example.com" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 12, border: '1px solid #ddd', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} required />
                        </div>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            style={{ padding: '0 15px', borderRadius: 12, border: '1px solid #ddd', background: 'white', cursor: 'pointer', outline: 'none' }}
                        >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading} style={{ padding: '12px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Granting Access...' : 'Grant Access & Send Email'}</button>
                    <p style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', margin: 0 }}>We use your default email app to send the invite link.</p>
                </form>
            </motion.div>
        </div>
    )
}
