import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, AnimatePresence } from 'framer-motion'
import { BsStars } from 'react-icons/bs'
import { FiTrash2, FiCalendar, FiCheckSquare, FiImage, FiType, FiPlus, FiX, FiGrid, FiYoutube, FiCopy, FiArrowRight, FiLink, FiMaximize2, FiGlobe, FiScissors, FiClipboard, FiLayers, FiCheck, FiMusic, FiMic, FiCode, FiMousePointer, FiSquare, FiClock, FiPlay, FiPause, FiRotateCcw, FiLayout, FiBarChart2, FiSmile, FiStar, FiCircle, FiUser, FiColumns, FiActivity, FiTerminal, FiMessageSquare, FiCheckCircle, FiTarget, FiBell, FiSend } from 'react-icons/fi'

import { useMediaQuery } from '../hooks/useMediaQuery'

// Helper for scalable UI elements based on node width
const getScale = (w, h = 0) => {
    // Use scaling based on the SMALLER relative dimension to ensure content fits.
    // If width scales 3x but height is 1x, we should keep font small so it fits.
    // If both scale 3x, then we can grow the font.
    const sw = (w || 320) / 320
    const sh = (h || 240) / 240
    const s = Math.max(Math.min(sw, sh), 1)
    return {
        rad: Math.min(12 * s, 32),
        p: Math.min(12 * s, 40), // Reduced max padding
        gap: Math.min(8 * s, 24),
        fsHead: `clamp(1rem, ${1 * s}rem, 2.5rem)`, // Reduced max font
        fsBody: `clamp(0.9rem, ${0.9 * s}rem, 3rem)`,
        icon: Math.min(Math.max(18 * s, 18), 48),
        mb: Math.min(8 * s, 24) // Reduced max margin bottom to avoid huge gaps
    }
}

// --- Utilities ---
const useDebounce = (callback, delay) => {
    const timeoutRef = useRef(null)
    return (...args) => { clearTimeout(timeoutRef.current); timeoutRef.current = setTimeout(() => callback(...args), delay) }
}
const Input = (props) => (<input {...props} style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)', outline: 'none', transition: 'all 0.2s', ...props.style }} onFocus={(e) => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)' }} onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.boxShadow = 'none'; if (props.onBlur) props.onBlur(e) }} />)
const Button = ({ children, onClick, variant = 'primary', style }) => {
    const isDanger = variant === 'danger';
    const bg = isDanger ? 'linear-gradient(135deg, #FF6B6B, #FF8787)' : 'linear-gradient(135deg, #3b82f6, #06b6d4)';
    const shadow = isDanger ? '0 4px 15px rgba(255, 107, 107, 0.4)' : '0 4px 15px rgba(59, 130, 246, 0.4)';
    return (
        <motion.button
            whileHover={{ scale: 1.05, translateY: -1, boxShadow: shadow }}
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            style={{
                background: bg, border: 'none', color: 'white', padding: '10px 20px',
                borderRadius: 14, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'box-shadow 0.2s', ...style
            }}
        >
            {children}
        </motion.button>
    )
}
const ToolBtn = ({ icon, label, onClick, active }) => (
    <motion.button
        whileHover={{ scale: 1.1, translateY: -4 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        title={label}
        style={{
            width: 48, height: 48, borderRadius: 16,
            background: active ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)',
            color: active ? 'white' : '#64748b',
            fontSize: '1.4rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: active ? '0 8px 20px rgba(37, 99, 235, 0.3)' : '0 4px 6px rgba(0,0,0,0.05)',
            border: active ? 'none' : '1px solid rgba(255,255,255,0.5)'
        }}
    >
        {icon}
    </motion.button>
)

// --- Node Types ---
const EmbedNode = ({ node, onUpdate }) => {
    const [isHovered, setIsHovered] = useState(false)
    return (
        <div
            style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', background: 'transparent' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Floating Drag Handle / Header - Only visible on hover */}
            <div
                className="drag-handle"
                style={{
                    position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)', height: 28,
                    background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
                    borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '0 12px', fontSize: '0.75rem', fontWeight: 600, color: 'white',
                    cursor: 'grab', zIndex: 50, opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s, top 0.2s',
                    pointerEvents: isHovered ? 'auto' : 'none', whiteSpace: 'nowrap'
                }}
            >
                {node.title === 'Spotify' && <FiMusic />}
                {node.title === 'BandLab' && <FiMic />}
                {node.title === 'YouTube' && <FiYoutube />}
                {node.title || 'Embed'}
            </div>

            {/* Iframe Content */}
            <div style={{ flex: 1, borderRadius: 24, overflow: 'hidden', background: '#000', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <iframe
                    src={node.src}
                    title={node.title}
                    style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
                />
            </div>
        </div>
    )
}

const TimerNode = ({ node, onUpdate }) => {
    const [timeLeft, setTimeLeft] = useState(node.duration || 300)

    useEffect(() => {
        if (!node.isRunning || !node.startedAt) {
            setTimeLeft(node.duration || 300)
            return
        }
        const interval = setInterval(() => {
            const elapsed = (Date.now() - new Date(node.startedAt).getTime()) / 1000
            const remaining = Math.max(Math.ceil((node.duration || 300) - elapsed), 0)
            setTimeLeft(remaining)
        }, 1000)
        return () => clearInterval(interval)
    }, [node.startedAt, node.isRunning, node.duration])

    const toggle = () => {
        if (node.isRunning) {
            onUpdate(node.id, { isRunning: false, duration: timeLeft, startedAt: null })
        } else {
            onUpdate(node.id, { isRunning: true, startedAt: new Date().toISOString() })
        }
    }

    const reset = () => {
        onUpdate(node.id, { isRunning: false, duration: 300, startedAt: null })
    }

    const adjust = (delta) => {
        if (node.isRunning) return
        onUpdate(node.id, { duration: Math.max((node.duration || 300) + delta, 10) })
    }

    const format = (s) => {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${m}:${sec.toString().padStart(2, '0')}`
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#f39c12', fontWeight: 'bold' }}><FiClock size={18} /> Timer</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#333' }}>
                    {format(timeLeft)}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button onClick={toggle} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: node.isRunning ? '#ff4d4f' : '#2ecc71', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onPointerDown={e => e.stopPropagation()}>
                        {node.isRunning ? <FiPause /> : <FiPlay style={{ marginLeft: 2 }} />}
                    </button>
                    <button onClick={reset} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: '#f0f0f0', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onPointerDown={e => e.stopPropagation()}>
                        <FiRotateCcw />
                    </button>
                </div>
                {!node.isRunning && (
                    <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
                        <button onClick={() => adjust(-60)} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, border: '1px solid #eee', background: 'transparent', cursor: 'pointer' }} onPointerDown={e => e.stopPropagation()}>-1m</button>
                        <button onClick={() => adjust(60)} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, border: '1px solid #eee', background: 'transparent', cursor: 'pointer' }} onPointerDown={e => e.stopPropagation()}>+1m</button>
                    </div>
                )}
            </div>
        </div>
    )
}

const CounterNode = ({ node, onUpdate }) => {
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 20 }}>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#333' }}>{node.count || 0}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button onClick={(e) => { e.stopPropagation(); onUpdate(node.id, { count: (node.count || 0) - 1 }) }} style={{ width: 40, height: 40, borderRadius: '50%', background: '#ff4d4f', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                <button onClick={(e) => { e.stopPropagation(); onUpdate(node.id, { count: (node.count || 0) + 1 }) }} style={{ width: 40, height: 40, borderRadius: '50%', background: '#52c41a', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
        </div>
    )
}

const StickerNode = ({ node, onUpdate }) => {
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
            <div style={{ fontSize: '8rem', userSelect: 'none' }}>{node.content || '😎'}</div>
        </div>
    )
}

// --- New Widgets (10 Items) ---
const ProgressNode = ({ node, onUpdate }) => {
    const r = 60
    const c = 2 * Math.PI * r
    const p = node.progress || 0
    const off = c - (p / 100) * c
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 24, padding: 10 }}>
            <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="70" cy="70" r={r} stroke="#f0f0f0" strokeWidth="12" fill="none" />
                    <circle cx="70" cy="70" r={r} stroke="url(#progress-gradient)" strokeWidth="12" fill="none"
                        strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 0.5s ease' }} strokeLinecap="round" />
                    <defs>
                        <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4facfe" />
                            <stop offset="100%" stopColor="#00f2fe" />
                        </linearGradient>
                    </defs>
                </svg>
                <div style={{ position: 'absolute', fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>{p}%</div>
            </div>
            <input
                type="range" min="0" max="100" value={p}
                onChange={e => onUpdate(node.id, { progress: parseInt(e.target.value) })}
                style={{ width: '80%', marginTop: 15, accentColor: '#00f2fe', cursor: 'grab' }}
                onPointerDown={e => e.stopPropagation()}
            />
        </div>
    )
}

const RatingNode = ({ node, onUpdate }) => {
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'white', borderRadius: 20 }}>
            {[1, 2, 3, 4, 5].map(v => (
                <FiStar key={v} size={28} fill={(node.rating || 0) >= v ? '#f1c40f' : 'none'} color={((node.rating || 0) >= v) ? '#f1c40f' : '#ccc'} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onUpdate(node.id, { rating: v }) }} />
            ))}
        </div>
    )
}

const ShapeNode = ({ node, onUpdate }) => {
    const shapes = { circle: '50%', square: '0%', rounded: '20%' }
    const s = node.shape || 'circle'
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: '100%', background: node.color || '#3498db', borderRadius: shapes[s], transition: 'all 0.3s' }} onClick={() => {
                const keys = Object.keys(shapes); const next = keys[(keys.indexOf(s) + 1) % keys.length]
                onUpdate(node.id, { shape: next })
            }} />
        </div>
    )
}

const AvatarNode = ({ node, onUpdate }) => {
    return (
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {node.src ? <img src={node.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FiUser size={48} color="#aaa" />}
        </div>
    )
}

const KanbanNode = ({ node, onUpdate }) => {
    return (
        <div style={{ width: '100%', height: '100%', background: 'white', borderRadius: 16, padding: 10, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: 5, marginBottom: 5 }}>To Do</div>
            <div style={{ flex: 1, background: '#f9f9f9', borderRadius: 8, padding: 5 }}>
                <div style={{ padding: 4, background: 'white', marginBottom: 4, borderRadius: 4, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '0.8rem' }}>Task 1</div>
                <div style={{ padding: 4, background: 'white', marginBottom: 4, borderRadius: 4, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '0.8rem' }}>Task 2</div>
            </div>
        </div>
    )
}

const ClockNode = ({ node, onUpdate }) => {
    const [time, setTime] = useState(new Date())
    useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])
    const { fsHead, rad } = getScale(node.w, node.h)
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333', color: '#0f0', fontFamily: 'monospace', fontSize: fsHead, borderRadius: rad, border: '4px solid #555' }}>
            {time.toLocaleTimeString()}
        </div>
    )
}

const QuoteNode = ({ node, onUpdate }) => {
    const quotes = ["Think big.", "Just do it.", "Stay hungry.", "Code is poetry."]
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20, fontStyle: 'italic', background: '#fff8dc', borderRadius: 0, boxShadow: '5px 5px 0 rgba(0,0,0,0.1)' }}>
            "{node.quote || quotes[0]}"
        </div>
    )
}

const CodeNode = ({ node, onUpdate }) => {
    const { rad, p, gap, fsBody, icon, mb } = getScale(node.w, node.h)
    return (
        <div style={{ width: '100%', height: '100%', background: '#282c34', borderRadius: rad, padding: p, color: '#abb2bf', fontFamily: 'monospace', fontSize: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: gap, marginBottom: mb, flexShrink: 0 }}>
                <div style={{ width: icon * 0.6, height: icon * 0.6, borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: icon * 0.6, height: icon * 0.6, borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: icon * 0.6, height: icon * 0.6, borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <textarea
                value={node.code || '// Write code here...'}
                onChange={e => onUpdate(node.id, { code: e.target.value })}
                style={{ flex: 1, width: '100%', background: 'transparent', border: 'none', color: 'inherit', outline: 'none', resize: 'none', fontSize: 'inherit', lineHeight: 1.5 }}
                onPointerDown={e => e.stopPropagation()}
            />
        </div>
    )
}

const EmojiNode = ({ node, onUpdate }) => {
    const emojis = ['👍', '👎', '🔥', '🎉', '❤️', '🚀', '🤔', '👀', '✅', '❌']
    return (
        <div style={{ width: '100%', height: '100%', background: 'white', borderRadius: 20, padding: 10, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, overflow: 'hidden' }}>
            {emojis.map(e => (
                <div key={e} style={{ fontSize: '1.5rem', cursor: 'pointer', textAlign: 'center', padding: 5, borderRadius: 5, transition: '0.2s' }} onClick={(ev) => { ev.stopPropagation(); onUpdate(node.id, { selected: e }) }} onMouseEnter={ev => ev.target.style.background = '#f0f0f0'} onMouseLeave={ev => ev.target.style.background = 'transparent'}>
                    {e}
                </div>
            ))}
        </div>
    )
}

const PomodoroNode = ({ node, onUpdate }) => {
    const [timeLeft, setTimeLeft] = useState(node.timeLeft || 1500) // 25m
    const [isActive, setIsActive] = useState(node.isActive || false)
    const { fsHead, icon } = getScale(node.w, node.h)

    useEffect(() => {
        let interval = null
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(t => {
                    const newT = t - 1
                    if (newT % 5 === 0) onUpdate(node.id, { timeLeft: newT })
                    return newT
                })
            }, 1000)
        } else if (timeLeft === 0) {
            setIsActive(false)
            onUpdate(node.id, { isActive: false, timeLeft: 0 })
            // Play sound or notify
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => { })
        }
        return () => clearInterval(interval)
    }, [isActive, timeLeft, onUpdate, node.id])

    const toggle = () => {
        const next = !isActive
        setIsActive(next)
        onUpdate(node.id, { isActive: next, timeLeft })
    }

    const reset = () => {
        setIsActive(false)
        setTimeLeft(1500)
        onUpdate(node.id, { isActive: false, timeLeft: 1500 })
    }

    const fmt = (s) => {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${m}:${sec.toString().padStart(2, '0')}`
    }

    // Progress ring calculation
    const progress = 1 - (timeLeft / 1500)
    const r = 40
    const c = 2 * Math.PI * r

    return (
        <div style={{
            width: '100%', height: '100%',
            background: 'white', borderRadius: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            position: 'relative', overflow: 'hidden'
        }}>

            {/* Minimal UI */}
            <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 1.5, color: '#ff6b6b' }}>FOCUS</div>
                <div style={{ fontSize: `clamp(2rem, ${fsHead}, 4rem)`, fontWeight: '800', color: '#333', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(timeLeft)}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={toggle} onPointerDown={e => e.stopPropagation()} style={{
                        width: 48, height: 48, borderRadius: '50%', border: 'none',
                        background: isActive ? '#f8f9fa' : '#ff6b6b',
                        color: isActive ? '#ff6b6b' : 'white',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', boxShadow: isActive ? 'none' : '0 4px 15px rgba(255, 107, 107, 0.4)',
                        transition: '0.2s'
                    }}>
                        {isActive ? <FiPause /> : <FiPlay style={{ marginLeft: 2 }} />}
                    </button>
                    <button onClick={reset} onPointerDown={e => e.stopPropagation()} style={{
                        width: 48, height: 48, borderRadius: '50%', border: 'none',
                        background: '#f8f9fa', color: '#adb5bd',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', transition: '0.2s'
                    }}>
                        <FiRotateCcw />
                    </button>
                </div>
            </div>
        </div>
    )
}

const NotifyNode = ({ node, onUpdate }) => {
    const [timeLeft, setTimeLeft] = useState('')

    // Check permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, [])

    const scheduleNotification = () => {
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notification");
            return;
        }

        if (Notification.permission === "granted") {
            new Notification(node.text || "Hello from Whiteboard!");
            // Clear schedule if it was a scheduled firing
            if (node.scheduledTime && new Date(node.scheduledTime) <= new Date()) {
                onUpdate(node.id, { scheduledTime: '' })
            }
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") scheduleNotification();
            });
        }
    }

    // Timer Logic
    useEffect(() => {
        if (!node.scheduledTime) {
            setTimeLeft('')
            return
        }

        const checkTime = () => {
            const now = new Date().getTime()
            const target = new Date(node.scheduledTime).getTime()
            const diff = target - now

            if (diff <= 0) {
                scheduleNotification()
                onUpdate(node.id, { scheduledTime: '' }) // Reset
            } else {
                // Formatting time left
                if (diff > 86400000) setTimeLeft(Math.floor(diff / 86400000) + 'd')
                else if (diff > 3600000) setTimeLeft(Math.floor(diff / 3600000) + 'h')
                else if (diff > 60000) setTimeLeft(Math.floor(diff / 60000) + 'm')
                else setTimeLeft(Math.floor(diff / 1000) + 's')
            }
        }

        const timer = setInterval(checkTime, 1000)
        checkTime() // Initial check
        return () => clearInterval(timer)
    }, [node.scheduledTime, node.text])

    return (
        <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 16, display: 'flex', flexDirection: 'column',
            padding: 16, color: 'white', boxShadow: '0 4px 15px rgba(118, 75, 162, 0.3)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                    <FiBell /> <span>Notifier</span>
                </div>
                {timeLeft && <span style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: 10 }}>in {timeLeft}</span>}
            </div>

            <textarea
                value={node.text || ''}
                onChange={e => onUpdate(node.id, { text: e.target.value })}
                placeholder="Notification message..."
                onPointerDown={e => e.stopPropagation()}
                style={{
                    flex: 1, background: 'rgba(255,255,255,0.2)',
                    border: 'none', borderRadius: 8, padding: 8,
                    color: 'white', fontSize: '0.9rem', outline: 'none',
                    resize: 'none', marginBottom: 10
                }}
            />

            <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <input
                        type="datetime-local"
                        value={node.scheduledTime || ''}
                        onChange={e => onUpdate(node.id, { scheduledTime: e.target.value })}
                        style={{
                            width: '100%', padding: '6px', borderRadius: 8, border: 'none',
                            fontSize: '0.8rem', cursor: 'pointer', background: 'rgba(255,255,255,0.9)', color: '#333'
                        }}
                        onPointerDown={e => e.stopPropagation()}
                    />

                </div>

                <button onClick={scheduleNotification} onPointerDown={e => e.stopPropagation()} title="Send Now" style={{
                    background: 'white', color: '#764ba2', border: 'none',
                    width: 32, borderRadius: 8, fontWeight: 'bold',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <FiSend size={14} />
                </button>
            </div>
        </div>
    )
}

const LabelNode = ({ node, onUpdate, isSelected, isDragging }) => {
    const [hover, setHover] = useState(false)
    const isTransparent = node.color === 'transparent'
    const fontSize = node.fontSize || 32 // Default 2.5rem approx

    return (
        <div
            style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isTransparent ? 'transparent' : (node.color || 'white'),
                borderRadius: 8,
                border: isTransparent ? ((hover || isSelected) ? '1px dashed #ccc' : 'none') : (isSelected ? '2px solid var(--primary)' : '1px solid #eee'),
                padding: 10,
                transition: '0.2s'
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* Controls (visible on selection) */}
            {isSelected && !isDragging && (
                <div style={{
                    position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)',
                    background: 'white', padding: 4, borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', gap: 6, zIndex: 50
                }} onPointerDown={e => e.stopPropagation()}>
                    <button onClick={() => onUpdate(node.id, { fontSize: Math.max(12, fontSize - 4) })} title="Smaller" style={{ border: '1px solid #eee', background: 'white', borderRadius: 4, cursor: 'pointer', width: 24 }}>A-</button>
                    <button onClick={() => onUpdate(node.id, { fontSize: Math.min(120, fontSize + 4) })} title="Larger" style={{ border: '1px solid #eee', background: 'white', borderRadius: 4, cursor: 'pointer', width: 24 }}>A+</button>
                    <div style={{ width: 1, height: 20, background: '#eee' }}></div>
                    <button onClick={() => onUpdate(node.id, { color: isTransparent ? 'white' : 'transparent' })} title="Toggle Background" style={{ border: '1px solid #eee', background: isTransparent ? '#eee' : 'white', borderRadius: 4, cursor: 'pointer', padding: '0 8px', fontSize: '0.7rem' }}>
                        {isTransparent ? 'Solid' : 'Clear'}
                    </button>
                </div>
            )}

            <textarea
                value={node.content}
                onChange={e => onUpdate(node.id, { content: e.target.value })}
                placeholder="Heading"
                style={{
                    width: '100%', background: 'transparent',
                    border: 'none',
                    fontSize: fontSize,
                    fontWeight: '800',
                    color: '#333', resize: 'none', outline: 'none',
                    textAlign: 'center',
                    fontFamily: 'Outfit, sans-serif', lineHeight: 1.2, height: 'auto', overflow: 'hidden'
                }}
                onPointerDown={e => e.stopPropagation()}
            />
        </div>
    )
}

const SectionNode = ({ node, onUpdate }) => {
    return (
        <div style={{ width: '100%', height: '100%', border: '2px dashed rgba(0,0,0,0.15)', background: node.color || 'rgba(0,0,0,0.02)', borderRadius: 24, padding: 20, display: 'flex', flexDirection: 'column' }}>
            <div className="drag-handle" style={{ height: 30, cursor: 'grab', marginBottom: 10, display: 'flex', alignItems: 'center' }}>
                <FiLayout style={{ marginRight: 10, color: '#999' }} />
                <input
                    value={node.title || ''}
                    onChange={e => onUpdate(node.id, { title: e.target.value })}
                    placeholder="Section Name"
                    style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', color: '#555', fontWeight: 700, outline: 'none', width: '100%' }}
                    onPointerDown={e => e.stopPropagation()}
                />
            </div>
        </div>
    )
}

const DiceNode = ({ node, onUpdate }) => {
    const roll = () => {
        const val = Math.floor(Math.random() * 6) + 1
        onUpdate(node.id, { value: val })
    }
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 20 }} onClick={roll}>
            <motion.div
                key={node.value}
                initial={{ rotate: 180, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                style={{ fontSize: '4rem', fontWeight: 'bold', color: '#333' }}
            >
                {node.value || 1}
            </motion.div>
            <div style={{ fontSize: '0.9rem', color: '#999', marginTop: 10, fontWeight: 600 }}>Click to Roll</div>
        </div>
    )
}

const PollNode = ({ node, onUpdate }) => {
    const options = node.options || [{ id: 1, text: 'Yes', votes: 0 }, { id: 2, text: 'No', votes: 0 }]
    const totalVotes = options.reduce((acc, curr) => acc + curr.votes, 0) || 1
    const { rad, p, gap, fsHead, icon, mb, fsBody } = getScale(node.w)

    const vote = (optId) => {
        const hasVoted = localStorage.getItem(`poll_${node.id}`)
        if (hasVoted) {
            alert("You have already voted!")
            return
        }
        localStorage.setItem(`poll_${node.id}`, 'true')
        const newOpts = options.map(o => o.id === optId ? { ...o, votes: o.votes + 1 } : o)
        onUpdate(node.id, { options: newOpts })
    }

    const addOption = () => {
        const text = prompt("Enter option text:")
        if (text) {
            const newOpts = [...options, { id: Date.now(), text, votes: 0 }]
            onUpdate(node.id, { options: newOpts })
        }
    }

    return (
        <div style={{ padding: p, background: 'white', borderRadius: rad, height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 'bold', marginBottom: mb, color: '#333', display: 'flex', alignItems: 'center', gap: gap, fontSize: fsHead }}><FiBarChart2 color="#007bff" size={icon} /> Poll</div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: gap }}>
                {options.map(opt => {
                    const percent = Math.round((opt.votes / totalVotes) * 100)
                    const isWinner = opt.votes === Math.max(...options.map(o => o.votes)) && opt.votes > 0
                    return (
                        <div key={opt.id} onClick={() => vote(opt.id)} onPointerDown={e => e.stopPropagation()} style={{ cursor: 'pointer', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 500, fontSize: fsBody, color: '#444' }}>
                                <span>{opt.text} {isWinner && '👑'}</span>
                                <span>{opt.votes}</span>
                            </div>
                            <div style={{ height: 8, width: '100%', background: '#f1f3f5', borderRadius: 4, overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percent > 0 ? (opt.votes / Math.max(1, totalVotes)) * 100 : 0}%` }}
                                    style={{ height: '100%', background: isWinner ? '#ffd700' : '#4facfe', borderRadius: 4 }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
            <button onClick={addOption} style={{ marginTop: 15, width: '100%', padding: '10px', border: '1px dashed #ccc', background: '#fafafa', borderRadius: 12, color: '#666', cursor: 'pointer', fontSize: fsBody, fontWeight: 600, transition: '0.2s' }} onPointerDown={e => e.stopPropagation()}>+ Add Option</button>
        </div>
    )
}

const EmbedNodeWrapper = ({ node }) => {
    // We need to enable pointer events on iframe for interaction, but dragging relies on the header.
    // The drag-handle class in header connects to DraggableNode.
    return <EmbedNode node={node} />
}

// Helper to linkify text
const Linkify = ({ text }) => {
    if (!text) return null
    const parts = text.split(/(https?:\/\/[^\s]+)/g)
    return parts.map((part, i) => {
        if (part.match(/^https?:\/\//)) {
            return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#096dd9', textDecoration: 'underline', pointerEvents: 'auto' }} onPointerDown={e => e.stopPropagation()}>{part}</a>
        }
        return part
    })
}

const ContentDisplay = ({ content }) => {
    if (!content) return null
    const str = typeof content === 'string' ? content : JSON.stringify(content)

    // Check for markdown links [Title](URL)
    const hasMdLink = str.match(/\[(.*?)\]\((.*?)\)/)
    if (hasMdLink || str.includes('http')) {
        const items = str.split('\n')
        return (
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 10, padding: '6px 8px', background: 'rgba(0,0,0,0.03)', borderRadius: 6, fontStyle: 'italic', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map((line, i) => {
                    const match = line.match(/\[(.*?)\]\((.*?)\)/)
                    if (match) {
                        return <div key={i}><a href={match[2]} target="_blank" rel="noopener noreferrer" style={{ color: '#096dd9', display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'auto' }} onPointerDown={e => e.stopPropagation()}><FiLink size={14} /> {match[1]}</a></div>
                    }
                    return <div key={i}><Linkify text={line} /></div>
                })}
            </div>
        )
    }

    return <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 10, padding: '6px 8px', background: 'rgba(0,0,0,0.03)', borderRadius: 6, fontStyle: 'italic' }}>{str}</div>
}

const YouTubeNode = ({ node, onUpdate }) => {
    const [url, setUrl] = useState(''); const videoId = node.videoId
    const handleEmbed = () => { const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/); if (m && m[2].length === 11) { onUpdate(node.id, { videoId: m[2] }) } else alert("Invalid URL") }
    const validContent = typeof node.content === 'string' ? node.content : ''
    const { rad, p, gap, fsHead, icon, mb } = getScale(node.w)

    return (<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}> <div style={{ display: 'flex', alignItems: 'center', gap: gap, marginBottom: mb, color: '#FF0000', fontWeight: 'bold', fontSize: fsHead }}><FiYoutube size={icon} /> YouTube Video</div> {videoId ? (<div style={{ flex: 1, borderRadius: rad, overflow: 'hidden', background: 'black', position: 'relative' }}> <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} frameBorder="0" allowFullScreen style={{ pointerEvents: 'auto' }} onPointerDown={e => e.stopPropagation()} /> <button onClick={() => onUpdate(node.id, { videoId: null })} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX /></button> </div>) : (<div onPointerDown={e => e.stopPropagation()} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}> {validContent ? (<div style={{ textAlign: 'center' }}> <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '0.8rem', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Suggested: <strong>{validContent.replace('Search:', '')}</strong></p> <Button onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(validContent.replace('Search:', ''))}`, '_blank')}>Search YouTube</Button> <Button variant="danger" onClick={() => onUpdate(node.id, { content: '' })} style={{ marginTop: 5, fontSize: '0.7rem', padding: '4px 8px' }}>Clear</Button> </div>) : (<><Input placeholder="Paste YouTube URL..." value={url} onChange={e => setUrl(e.target.value)} /><Button onClick={handleEmbed}>Embed</Button></>)} </div>)} </div>)
}
const TodoNode = ({ node, onUpdate }) => {
    const items = node.items || []
    const [newItem, setNewItem] = useState('')

    // Derived state
    const total = items.length
    const doneCount = items.filter(i => i.done).length
    const progress = total === 0 ? 0 : (doneCount / total) * 100

    // Handlers
    const toggle = (i) => {
        const n = [...items]; n[i].done = !n[i].done;
        onUpdate(node.id, { items: n })
    }
    const deleteItem = (i) => {
        onUpdate(node.id, { items: items.filter((_, idx) => idx !== i) })
    }
    const addItem = (e) => {
        e.preventDefault()
        if (!newItem.trim()) return
        onUpdate(node.id, { items: [...items, { text: newItem, done: false }] })
        setNewItem('')
    }
    const updateItemText = (i, text) => {
        const n = [...items]; n[i].text = text;
        onUpdate(node.id, { items: n })
    }

    return (
        <div style={{
            width: '100%', height: '100%',
            background: 'white', borderRadius: 16,
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)'
        }}>
            {/* Header with Title and Progress */}
            <div style={{ padding: '12px 16px', background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#333' }}>
                        <div style={{ padding: 6, background: '#e6f7ff', borderRadius: 8, color: '#1890ff', display: 'flex' }}>
                            <FiCheckSquare />
                        </div>
                        <span>Tasks</span>
                    </div>
                </div>
                {/* Progress Bar */}
                <div style={{ height: 6, width: '100%', background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#52c41a' : '#1890ff', transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: 4, textAlign: 'right' }}>
                    {doneCount}/{total} completed
                </div>
            </div>

            {/* List Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {items.length === 0 && (
                    <div style={{ padding: 20, textAlign: 'center', color: '#ccc', fontStyle: 'italic', fontSize: '0.9rem' }}>
                        No tasks yet.<br />Add one below!
                    </div>
                )}
                {items.map((it, i) => (
                    <div key={i} className="todo-item" style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 16px', borderBottom: '1px solid rgba(0,0,0,0.03)',
                        transition: 'background 0.2s'
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <div
                            onClick={() => toggle(i)}
                            style={{
                                width: 20, height: 20, borderRadius: 6,
                                border: it.done ? '2px solid #52c41a' : '2px solid #ddd',
                                background: it.done ? '#52c41a' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', flexShrink: 0, transition: '0.2s'
                            }}
                        >
                            {it.done && <FiCheck size={14} color="white" />}
                        </div>
                        <input
                            value={it.text}
                            onChange={(e) => updateItemText(i, e.target.value)}
                            onPointerDown={e => e.stopPropagation()}
                            style={{
                                flex: 1, border: 'none', background: 'transparent',
                                outline: 'none', fontSize: '0.95rem',
                                color: it.done ? '#aaa' : '#333',
                                textDecoration: it.done ? 'line-through' : 'none',
                                transition: 'color 0.2s'
                            }}
                        />
                        <button
                            onClick={() => deleteItem(i)}
                            className="delete-btn"
                            style={{
                                border: 'none', background: 'transparent',
                                color: '#ff4d4f', cursor: 'pointer', padding: 4,
                                display: 'flex', opacity: 0.5, transition: '0.2s'
                            }}
                            onMouseEnter={e => e.target.style.opacity = 1}
                            onMouseLeave={e => e.target.style.opacity = 0.5}
                        >
                            <FiX />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add Item Footer */}
            <form onSubmit={addItem} style={{ padding: 12, borderTop: '1px solid #eee', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: 8, padding: '0 12px' }}>
                    <FiPlus color="#999" />
                    <input
                        value={newItem}
                        onChange={e => setNewItem(e.target.value)}
                        placeholder="Add a task..."
                        onPointerDown={e => e.stopPropagation()}
                        style={{
                            flex: 1, padding: '10px 8px', border: 'none',
                            background: 'transparent', outline: 'none', fontSize: '0.9rem'
                        }}
                    />
                </div>
            </form>
        </div>
    )
}
const CalendarNode = ({ node, onUpdate }) => {
    // Defines "Timeline" behavior
    const events = node.events || {}
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [time, setTime] = useState('12:00') // Default noon
    const [text, setText] = useState('')

    // Sort events by date/time key
    const sortedEvents = Object.entries(events).sort((a, b) => {
        return new Date(a[0]) - new Date(b[0])
    })

    // Add event handler
    const addEvent = (e) => {
        e.preventDefault()
        if (!text) return
        // specific time key
        const key = `${date}T${time}`
        onUpdate(node.id, { events: { ...events, [key]: text } })
        setText('')
    }

    const deleteEvent = (key) => {
        const NewEvents = { ...events }
        delete NewEvents[key]
        onUpdate(node.id, { events: NewEvents })
    }

    return (
        <div style={{
            width: '100%', height: '100%',
            background: 'white', borderRadius: 16,
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)'
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', display: 'flex', alignItems: 'center', gap: 8,
                fontWeight: 700, fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(118, 75, 162, 0.3)', zIndex: 1
            }}>
                <FiClock /> <span>Timeline</span>
            </div>

            {/* Scrollable Timeline Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', position: 'relative' }}>
                {sortedEvents.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#ccc', fontStyle: 'italic', marginTop: 20 }}>
                        <FiCalendar size={32} style={{ marginBottom: 8, opacity: 0.5 }} /><br />
                        Add an event to start<br />your timeline
                    </div>
                )}

                <div style={{ position: 'relative', marginLeft: 8 }}>
                    {/* Vertical Line */}
                    {sortedEvents.length > 0 && (
                        <div style={{
                            position: 'absolute', left: 6, top: 10, bottom: 10,
                            width: 2, background: '#e0e0e0', borderRadius: 2
                        }} />
                    )}

                    {sortedEvents.map(([key, content], i) => {
                        const d = new Date(key)
                        const isValid = !isNaN(d.getTime())
                        // Format: "Oct 24"
                        const dateStr = isValid ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : key
                        // Format: "14:30"
                        const timeStr = isValid ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''

                        return (
                            <div key={key} style={{ display: 'flex', marginBottom: 20, position: 'relative' }}>
                                {/* Timeline Dot */}
                                <div style={{
                                    width: 14, height: 14, borderRadius: '50%',
                                    background: 'white', border: '3px solid #764ba2',
                                    boxShadow: '0 0 0 2px white', zIndex: 2,
                                    flexShrink: 0
                                }} />

                                {/* Content */}
                                <div style={{ marginLeft: 16, flex: 1 }}>
                                    {/* Date Label */}
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#764ba2', textTransform: 'uppercase', letterSpacing: 0.5 }}>{dateStr}</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#aaa' }}>{timeStr}</span>
                                    </div>

                                    {/* Card */}
                                    <div className="timeline-card" style={{
                                        background: '#f8f9fa', padding: '10px 14px', borderRadius: '0 12px 12px 12px',
                                        border: '1px solid rgba(0,0,0,0.05)', position: 'relative',
                                        fontSize: '0.9rem', color: '#444', lineHeight: 1.5,
                                        transition: '0.2s', cursor: 'default'
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'; e.currentTarget.querySelector('.del-btn').style.opacity = 1 }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.querySelector('.del-btn').style.opacity = 0 }}
                                    >
                                        {content}
                                        <button
                                            className="del-btn"
                                            onClick={() => deleteEvent(key)}
                                            style={{
                                                position: 'absolute', top: 8, right: 8,
                                                background: 'white', border: '1px solid #eee', borderRadius: '50%',
                                                width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', color: '#ff6b6b', opacity: 0, transition: '0.2s'
                                            }}
                                        ><FiX size={12} /></button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Input Area */}
            <form onSubmit={addEvent} style={{ padding: 12, borderTop: '1px solid #eee', background: 'white', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        style={{ flex: 2, padding: '6px 10px', borderRadius: 8, border: '1px solid #eee', fontSize: '0.8rem', background: '#f9f9f9', outline: 'none' }}
                        required
                    />
                    <input
                        type="time"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #eee', fontSize: '0.8rem', background: '#f9f9f9', outline: 'none' }}
                        required
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: 8, padding: '0 4px 0 12px' }}>
                    <input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Add event..."
                        style={{ flex: 1, padding: '10px 0', background: 'transparent', border: 'none', outline: 'none', fontSize: '0.9rem' }}
                        onPointerDown={e => e.stopPropagation()}
                    />
                    <button type="submit" style={{ background: '#764ba2', color: 'white', border: 'none', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiPlus />
                    </button>
                </div>
            </form>
        </div>
    )

}
const ImageNode = ({ node, onUpdate }) => {
    const up = (e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onloadend = () => onUpdate(node.id, { src: r.result }); r.readAsDataURL(f) } }
    const { rad, gap, fsHead, icon, mb } = getScale(node.w)
    return (<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}> <div style={{ display: 'flex', alignItems: 'center', gap: gap, marginBottom: mb, color: '#9b59b6', fontWeight: 'bold', fontSize: fsHead }}><FiImage size={icon} /> Image</div> <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.03)', borderRadius: rad, overflow: 'hidden', position: 'relative' }}> {node.src ? (<> <img src={node.src} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> <button onClick={() => onUpdate(node.id, { src: '' })} style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer' }} onPointerDown={e => e.stopPropagation()}><FiX /></button> </>) : (<div style={{ textAlign: 'center' }} onPointerDown={e => e.stopPropagation()}> <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Upload Image</p> <input type="file" onChange={up} style={{ maxWidth: 180, marginTop: 10 }} /> </div>)} </div> </div>)
}

const LinkNode = ({ node, onUpdate }) => {
    const validContent = typeof node.content === 'string' ? node.content : ''
    const [url, setUrl] = useState(node.url || '');
    const saveUrl = () => { if (url) onUpdate(node.id, { url, content: url }) }
    let hostname = ''; let isValid = false
    try { if (validContent) { hostname = new URL(validContent).hostname; isValid = true } } catch (e) { }
    const { rad, gap, fsHead, icon, mb } = getScale(node.w)

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: gap, marginBottom: mb, color: '#3498db', fontWeight: 'bold', fontSize: fsHead }}><FiGlobe size={icon} /> Web Link</div>
            {isValid ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <a href={validContent} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'rgba(255,255,255,0.5)', borderRadius: 12, textDecoration: 'none', color: '#333', border: '1px solid rgba(0,0,0,0.1)' }}>
                        <img src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`} style={{ width: 32, height: 32, borderRadius: 4 }} onError={(e) => e.target.style.display = 'none'} />
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{hostname}</div>
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>{validContent}</div>
                        </div>
                        <FiArrowRight style={{ marginLeft: 'auto' }} />
                    </a>
                    <button onClick={() => onUpdate(node.id, { content: '' })} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', alignSelf: 'center', fontSize: '0.8rem' }}>Edit URL</button>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: 5, marginTop: 'auto', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    {validContent && validContent.startsWith('Search:') ? (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 10px 0', color: '#666' }}>Suggested: <strong>{validContent.replace('Search:', '')}</strong></p>
                            <Button onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(validContent.replace('Search:', ''))}`, '_blank')}>Search Google</Button>
                        </div>
                    ) : (
                        <>
                            {validContent && <p style={{ fontSize: '0.8rem', color: 'red', wordBreak: 'break-all' }}>Invalid URL: {validContent}</p>}
                            <div style={{ display: 'flex', gap: 5, width: '100%' }}>
                                <Input placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} />
                                <Button onClick={saveUrl}>Save</Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

const NoteNode = ({ node, onUpdate, isSelected, isDragging }) => {
    const [hover, setHover] = useState(false)
    const [toolbar, setToolbar] = useState(null) // { x, y, visible }
    const editorRef = useRef(null)
    const isHandwriting = node.font !== 'sans'
    const isTransparent = node.color === 'transparent'

    // Modern Palette
    const colors = {
        yellow: '#fff9b1',
        green: '#d5f692',
        pink: '#ffcce1',
        blue: '#cbf0f8',
        white: '#ffffff',
    }
    const activeColor = colors[Object.keys(colors).find(k => colors[k] === node.color) || 'yellow'] || node.color || colors.yellow

    // Sync content if changed externally, but DON'T override if focused (avoids cursor jumps)
    useEffect(() => {
        if (editorRef.current && document.activeElement !== editorRef.current) {
            if (editorRef.current.innerHTML !== (node.content || '')) {
                editorRef.current.innerHTML = node.content || ''
            }
        }
    }, [node.content])

    const handleSelect = () => {
        const sel = window.getSelection()
        if (!sel.isCollapsed && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
            const range = sel.getRangeAt(0)
            const rect = range.getBoundingClientRect()
            setToolbar({
                left: rect.left + (rect.width / 2) - 40, // Center toolbar
                top: rect.top - 45,
                visible: true
            })
        } else {
            setToolbar(null)
        }
    }

    const execLink = (e) => {
        e.preventDefault()
        const url = prompt("Enter URL:", "https://")
        if (url) {
            document.execCommand('createLink', false, url)
            onUpdate(node.id, { content: editorRef.current.innerHTML }) // Save immediately
        }
        setToolbar(null)
    }

    const execUnlink = (e) => {
        e.preventDefault()
        document.execCommand('unlink')
        onUpdate(node.id, { content: editorRef.current.innerHTML })
        setToolbar(null)
    }

    return (
        <div
            style={{
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                background: isTransparent ? 'rgba(255,255,255,0.2)' : activeColor,
                backdropFilter: isTransparent ? 'blur(10px)' : 'none',
                borderRadius: 12,
                boxShadow: isSelected
                    ? '0 0 0 2px #333, 0 8px 30px rgba(0,0,0,0.12)'
                    : (isTransparent ? 'none' : '0 4px 15px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)'),
                border: isTransparent ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(0,0,0,0.05)',
                transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                overflow: 'visible' // Allow toolbar to show? Actually fixed pos toolbar doesn't care.
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* Header - Fixed Height Area for Gripping/Controls */}
            <div style={{
                flex: '0 0 36px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 12px',
                borderBottom: '1px solid rgba(0,0,0,0.04)',
                cursor: 'grab' // Indication it can be moved
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, color: '#333' }}>
                    <FiType size={14} /> <span>NOTE</span>
                </div>

                {/* Controls - Visible on Selection */}
                <div style={{
                    display: 'flex', gap: 6,
                    opacity: isSelected && !isDragging ? 1 : 0,
                    transform: isSelected && !isDragging ? 'translateY(0)' : 'translateY(2px)',
                    transition: 'all 0.2s',
                    pointerEvents: isSelected && !isDragging ? 'auto' : 'none'
                }} onPointerDown={e => e.stopPropagation()}>
                    <button
                        onClick={() => onUpdate(node.id, { font: isHandwriting ? 'sans' : 'hand' })}
                        title="Toggle Handwriting"
                        style={{ background: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '2px 6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}
                    >
                        {isHandwriting ? 'Aa' : '✍️'}
                    </button>
                    {Object.entries(colors).map(([name, c]) => (
                        <div
                            key={name}
                            onClick={() => onUpdate(node.id, { color: c })}
                            style={{
                                width: 14, height: 14, borderRadius: '50%',
                                background: c,
                                border: '1px solid rgba(0,0,0,0.1)',
                                cursor: 'pointer',
                                transform: node.color === c ? 'scale(1.2)' : 'scale(1)',
                                boxShadow: node.color === c ? '0 0 0 2px #333' : 'none',
                                transition: '0.2s'
                            }}
                            title={name}
                        />
                    ))}
                    <div
                        onClick={() => onUpdate(node.id, { color: 'transparent' })}
                        style={{
                            width: 14, height: 14, borderRadius: '50%',
                            background: 'conic-gradient(#eee 0% 25%, white 25% 50%, #eee 50% 75%, white 75%) 0 0 / 6px 6px',
                            border: '1px solid rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            transform: node.color === 'transparent' ? 'scale(1.2)' : 'scale(1)',
                            boxShadow: node.color === 'transparent' ? '0 0 0 2px #333' : 'none'
                        }}
                        title="Transparent"
                    />
                </div>
            </div>

            {/* Body - Flex 1 to fill space */}
            <div style={{ flex: 1, width: '100%', position: 'relative', overflowY: 'auto', scrollbarWidth: 'none' }}>
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={e => onUpdate(node.id, { content: e.currentTarget.innerHTML })}
                    onMouseUp={handleSelect}
                    onKeyUp={handleSelect}
                    onPointerDown={e => e.stopPropagation()}
                    style={{
                        width: '100%', minHeight: '100%',
                        border: 'none', background: 'transparent',
                        outline: 'none',
                        fontSize: '1rem',
                        lineHeight: 1.6,
                        color: '#2d3436',
                        padding: '16px',
                        fontFamily: isHandwriting ? '"Kalam", cursive' : '"Inter", sans-serif',
                        whiteSpace: 'pre-wrap', // Preserve newlines
                        cursor: 'text'
                    }}
                />
            </div>

            {/* Floating Link Toolbar */}
            {toolbar && toolbar.visible && (
                <div style={{
                    position: 'fixed', top: toolbar.top, left: toolbar.left,
                    background: '#222', padding: '6px 10px', borderRadius: 8,
                    display: 'flex', gap: 8, alignItems: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 9999,
                    animation: 'fadeIn 0.2s ease'
                }} onPointerDown={e => e.preventDefault() /* Prevent losing focus */}>
                    <button onClick={execLink} title="Add Link" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}><FiLink size={14} /></button>
                    <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)' }} />
                    <button onClick={execUnlink} title="Remove Link" style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', display: 'flex' }}><FiTrash2 size={14} /></button>
                </div>
            )}
        </div>
    )
}

// --- Connection Layer ---
// Smart Anchor Logic: Connects the nearest/most logical sides of two nodes
const getAnchors = (n1, n2) => {
    const w1 = n1.w || 320; const h1 = n1.h || 240; const w2 = n2.w || 320; const h2 = n2.h || 240
    const c1 = { x: n1.x + w1 / 2, y: n1.y + h1 / 2 }; const c2 = { x: n2.x + w2 / 2, y: n2.y + h2 / 2 }
    const dx = c2.x - c1.x; const dy = c2.y - c1.y
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) return { sx: n1.x + w1, sy: n1.y + h1 / 2, ex: n2.x, ey: n2.y + h2 / 2, c1x: 50, c1y: 0, c2x: -50, c2y: 0 } // R -> L
        else return { sx: n1.x, sy: n1.y + h1 / 2, ex: n2.x + w2, ey: n2.y + h2 / 2, c1x: -50, c1y: 0, c2x: 50, c2y: 0 } // L -> R
    } else {
        if (dy > 0) return { sx: n1.x + w1 / 2, sy: n1.y + h1, ex: n2.x + w2 / 2, ey: n2.y, c1x: 0, c1y: 50, c2x: 0, c2y: -50 } // B -> T
        else return { sx: n1.x + w1 / 2, sy: n1.y, ex: n2.x + w2 / 2, ey: n2.y + h2, c1x: 0, c1y: -50, c2x: 0, c2y: 50 } // T -> B
    }
}
const ConnectionLayer = ({ nodes, edges, onDeleteEdge, mode, tempEdge, dragOverrides }) => {
    return (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
            <defs>
                <linearGradient id="glass-gradient" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4facfe" />
                    <stop offset="100%" stopColor="#00f2fe" />
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="5" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#00f2fe" style={{ filter: 'drop-shadow(0 0 5px #00f2fe)' }} />
                </marker>
                <marker id="arrowhead-del" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ff4d4f" />
                </marker>
            </defs>
            {edges.map((edge, i) => {
                const fNode = nodes.find(n => n.id === edge.from)
                const tNode = nodes.find(n => n.id === edge.to)
                if (!fNode || !tNode) return null

                // Apply Overrides for smooth dragging
                const f = dragOverrides && dragOverrides[fNode.id] ? { ...fNode, ...dragOverrides[fNode.id] } : fNode
                const t = dragOverrides && dragOverrides[tNode.id] ? { ...tNode, ...dragOverrides[tNode.id] } : tNode

                const { sx, sy, ex, ey, c1x, c1y } = getAnchors(f, t)
                // Bezier Curve Logic
                let pathD = ''
                const dx = Math.abs(ex - sx)
                const dy = Math.abs(ey - sy)
                if (Math.abs(c1x) > Math.abs(c1y)) { // Horizontal Preferred
                    const cp = Math.max(dx * 0.5, 50)
                    pathD = `M ${sx} ${sy} C ${sx + cp * (sx < ex ? 1 : -1)} ${sy}, ${ex - cp * (sx < ex ? 1 : -1)} ${ey}, ${ex} ${ey}`
                } else { // Vertical Preferred
                    const cp = Math.max(dy * 0.5, 50)
                    pathD = `M ${sx} ${sy} C ${sx} ${sy + cp * (sy < ey ? 1 : -1)}, ${ex} ${ey - cp * (sy < ey ? 1 : -1)}, ${ex} ${ey}`
                }
                return (
                    <g key={edge.id} style={{ pointerEvents: 'auto', cursor: mode === 'delete' ? 'not-allowed' : 'pointer' }} onClick={() => onDeleteEdge(edge.id)}>
                        <path d={pathD} stroke="transparent" strokeWidth="20" fill="none" />
                        <motion.path
                            d={pathD}
                            stroke="#5ac8fa"
                            strokeWidth="3"
                            strokeDasharray="10 10"
                            fill="none"
                            markerEnd={undefined}
                            initial={{ strokeDashoffset: 0 }}
                            animate={{ strokeDashoffset: [-20, 0] }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            style={{ filter: mode === 'delete' ? 'none' : 'drop-shadow(0 0 4px #5ac8fa)', strokeLinecap: 'round' }}
                        />
                    </g>
                )
            })}
            {tempEdge && (() => {
                const f = nodes.find(n => n.id === tempEdge.from)
                if (!f) return null
                const t = { x: tempEdge.to.x - 1, y: tempEdge.to.y - 1, w: 2, h: 2, id: 'temp' } // Fake target
                const { sx, sy, ex, ey } = getAnchors(f, t)
                const pathD = `M ${sx} ${sy} L ${ex} ${ey}`
                return (
                    <path d={pathD} stroke="#5ac8fa" strokeWidth="2" strokeDasharray="5 5" fill="none" markerEnd="url(#arrowhead)" style={{ filter: 'drop-shadow(0 0 4px #5ac8fa)' }} />
                )
            })()}
        </svg>
    )
}

// --- Draggable Node (Resizable + Handles) ---
const DraggableNode = ({ node, scale, isSelected, onSelect, onUpdatePosition, onUpdateData, onDelete, onConnectStart, onEdgeStart, onDrag, onResize, onResizeEnd, onDragEnd, magnetMode, canvasSize }) => {
    const x = useMotionValue(node.x); const y = useMotionValue(node.y);
    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const ignoreSyncRef = useRef(0)
    const [size, setSize] = useState({ w: node.w || 320, h: node.h || 240 })
    useEffect(() => { if (!isDragging && !isResizing && Date.now() > ignoreSyncRef.current) { x.set(node.x); y.set(node.y) } }, [node.x, node.y, isDragging, isResizing])
    useEffect(() => { if (!isResizing && Date.now() > ignoreSyncRef.current) setSize({ w: node.w || 320, h: node.h || 240 }) }, [node.w, node.h, isResizing]) // Sync external updates

    const handleDragStart = (e) => {
        if (onConnectStart || e.button !== 0 || e.target.closest('button') || e.target.closest('input') || e.target.closest('.no-drag') || e.target.closest('.drag-handle') === false && e.target.closest('.glass-panel') === null && !e.target.classList.contains('glass-panel')) return
        // Note: The original drag logic was loose. We keep existing checks but ensured class logic.
        // Actually, the original line was:
        if (onConnectStart || e.button !== 0 || e.target.closest('button') || e.target.closest('input') || e.target.closest('.no-drag') || e.target.classList.contains('handle')) return

        e.stopPropagation();
        const startX = e.clientX; const startY = e.clientY
        const startNodeX = x.get(); const startNodeY = y.get()
        setIsDragging(true); onSelect(e)
        const onMove = (be) => {
            const dx = (be.clientX - startX) / (scale || 1); const dy = (be.clientY - startY) / (scale || 1);
            let curX = startNodeX + dx; let curY = startNodeY + dy

            // Magnet Snap
            if (magnetMode) {
                curX = Math.round(curX / 50) * 50
                curY = Math.round(curY / 50) * 50
            }

            // Canvas Clamp
            if (canvasSize) {
                curX = Math.min(Math.max(curX, 0), canvasSize.w - size.w)
                curY = Math.min(Math.max(curY, 0), canvasSize.h - size.h)
            }

            x.set(curX); y.set(curY)
            if (onDrag) onDrag(node.id, curX, curY)
        }
        const onUp = (be) => {
            window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); setIsDragging(false)
            ignoreSyncRef.current = Date.now() + 2000
            if (onDragEnd) onDragEnd(node.id)
            const dx = x.get() - startNodeX; const dy = y.get() - startNodeY
            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) onUpdatePosition(node.id, { x: dx, y: dy })
        }
        window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp)
    }

    const handleResize = (e, dir) => {
        e.stopPropagation();
        const startX = e.clientX; const startY = e.clientY
        const startW = size.w; const startH = size.h
        const startLeft = x.get(); const startTop = y.get()
        setIsResizing(true)

        const onMove = (mv) => {
            const dx = (mv.clientX - startX) / (scale || 1)
            const dy = (mv.clientY - startY) / (scale || 1)

            let newW = startW
            let newH = startH
            let newX = startLeft
            let newY = startTop

            // 1. Calculate Unconstrained Dimensions
            if (dir.includes('e')) newW = Math.max(200, startW + dx)
            if (dir.includes('s')) newH = Math.max(150, startH + dy)
            if (dir.includes('w')) {
                // Width changes opposite to dx
                const proposedW = Math.max(200, startW - dx)
                // If we hit min width, we stop moving X
                if (proposedW === 200) {
                    newW = 200
                    newX = startLeft + (startW - 200)
                } else {
                    newW = proposedW
                    newX = startLeft + (startW - proposedW) // or startLeft + dx, roughly
                }
            }
            if (dir.includes('n')) {
                const proposedH = Math.max(150, startH - dy)
                if (proposedH === 150) {
                    newH = 150
                    newY = startTop + (startH - 150)
                } else {
                    newH = proposedH
                    newY = startTop + (startH - proposedH)
                }
            }

            // 2. Clamp to Canvas Boundaries (if canvasSize exists)
            if (canvasSize) {
                // Clamp Left (only if moving left)
                if (dir.includes('w')) {
                    if (newX < 0) {
                        newX = 0
                        newW = (startLeft + startW) - 0 // Keep right edge fixed
                    }
                }
                // Clamp Top (only if moving top)
                if (dir.includes('n')) {
                    if (newY < 0) {
                        newY = 0
                        newH = (startTop + startH) - 0 // Keep bottom edge fixed
                    }
                }
                // Clamp Right (only if moving right)
                if (dir.includes('e')) {
                    if (newX + newW > canvasSize.w) {
                        newW = canvasSize.w - newX
                    }
                }
                // Clamp Bottom (only if moving bottom)
                if (dir.includes('s')) {
                    if (newY + newH > canvasSize.h) {
                        newH = canvasSize.h - newY
                    }
                }
            }

            setSize({ w: newW, h: newH })
            if (dir.includes('w')) x.set(newX)
            if (dir.includes('n')) y.set(newY)
            if (onResize) onResize(node.id, { x: newX, y: newY, w: newW, h: newH })
        }
        const onUp = () => {
            window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
            setIsResizing(false)
            ignoreSyncRef.current = Date.now() + 2000
            if (onResizeEnd) onResizeEnd(node.id)
            onUpdateData(node.id, { w: size.w, h: size.h });
            if (x.get() !== startLeft || y.get() !== startTop) {
                onUpdatePosition(node.id, { x: x.get() - startLeft, y: y.get() - startTop })
            }
        }
        window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp)
    }

    const handleStyle = { position: 'absolute', width: 12, height: 12, background: 'white', borderRadius: '50%', border: '1px solid #999', zIndex: 101 }
    // Handles: nw, n, ne, e, se, s, sw, w
    const handles = [
        { dir: 'nw', top: -6, left: -6, cursor: 'nwse-resize' },
        { dir: 'n', top: -6, left: '50%', marginLeft: -6, cursor: 'ns-resize' },
        { dir: 'ne', top: -6, right: -6, cursor: 'nesw-resize' },
        { dir: 'e', top: '50%', right: -6, marginTop: -6, cursor: 'ew-resize' },
        { dir: 'se', bottom: -6, right: -6, cursor: 'nwse-resize' },
        { dir: 's', bottom: -6, left: '50%', marginLeft: -6, cursor: 'ns-resize' },
        { dir: 'sw', bottom: -6, left: -6, cursor: 'nesw-resize' },
        { dir: 'w', top: '50%', left: -6, marginTop: -6, cursor: 'ew-resize' }
    ]

    const isSuggested = node.aiStatus === 'suggested'

    return (
        <motion.div
            onPointerDown={handleDragStart}
            onClick={(e) => { e.stopPropagation(); if (onConnectStart) { onConnectStart(node.id) } else { onSelect(e) } }}
            onContextMenu={(e) => { onSelect(e) }}
            onHoverStart={() => setIsHovered(true)} onHoverEnd={() => setIsHovered(false)}
            whileHover={{ scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{ x, y, position: 'absolute', pointerEvents: 'auto', zIndex: isDragging ? 100 : (isHovered ? 60 : (isSelected ? 50 : 10)), width: size.w, height: size.h }}
        >
            {/* Handles - Only allow resize if selected or hovered */}
            {(isSelected || isHovered) && !isDragging && handles.map(h => (
                <div key={h.dir} onPointerDown={(e) => handleResize(e, h.dir)} style={{ ...handleStyle, ...h }} />
            ))}

            {/* AI Processing Glow Effect */}
            {/* Suggested Glow Animation */}
            {isSuggested && (
                <motion.div
                    animate={{
                        boxShadow: [
                            "0 0 0 2px rgba(121, 40, 202, 0.2), 0 0 10px rgba(79, 172, 254, 0.3)",
                            "0 0 0 4px rgba(121, 40, 202, 0.6), 0 0 20px rgba(79, 172, 254, 0.6)",
                            "0 0 0 2px rgba(121, 40, 202, 0.2), 0 0 10px rgba(79, 172, 254, 0.3)"
                        ]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: 'absolute',
                        inset: -2, // Slight overlap
                        borderRadius: 12,
                        zIndex: -1,
                        background: 'linear-gradient(135deg, #7928ca, #4facfe)',
                        opacity: 0.3 // Subtle background tint
                    }}
                />
            )}

            <div className="glass-panel" style={{
                width: '100%', height: '100%', padding: 0, borderRadius: 16, display: 'flex', flexDirection: 'column',
                background: node.color || 'rgba(255,255,255,0.65)',
                border: isSuggested ? '2px solid #7928ca' : (isSelected ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.4)'),
                boxShadow: isSelected || isDragging ? '0 15px 40px rgba(0,0,0,0.15)' : '0 10px 30px rgba(0,0,0,0.05)',
                backdropFilter: isDragging ? 'none' : 'blur(24px)', transition: 'box-shadow 0.2s, background 0.2s',

            }}>
                {React.Children.map(node.type === 'Todo' ? [<TodoNode key="todo" node={node} onUpdate={onUpdateData} />] :
                    node.type === 'Calendar' ? [<CalendarNode key="cal" node={node} onUpdate={onUpdateData} />] :
                        node.type === 'Notify' ? [<NotifyNode key="notify" node={node} onUpdate={onUpdateData} />] :
                            node.type === 'Image' ? [<ImageNode key="img" node={node} onUpdate={onUpdateData} />] :
                                node.type === 'YouTube' ? [<YouTubeNode key="yt" node={node} onUpdate={onUpdateData} />] :
                                    node.type === 'Link' ? [<LinkNode key="link" node={node} onUpdate={onUpdateData} />] :
                                        node.type === 'Embed' ? [<EmbedNode key="embed" node={node} onUpdate={onUpdateData} />] :
                                            node.type === 'Timer' ? [<TimerNode key="timer" node={node} onUpdate={onUpdateData} />] :
                                                node.type === 'Label' ? [<LabelNode key="label" node={node} onUpdate={onUpdateData} />] :
                                                    node.type === 'Section' ? [<SectionNode key="sect" node={node} onUpdate={onUpdateData} />] :
                                                        node.type === 'Dice' ? [<DiceNode key="dice" node={node} onUpdate={onUpdateData} />] :
                                                            node.type === 'Poll' ? [<PollNode key="poll" node={node} onUpdate={onUpdateData} />] :
                                                                node.type === 'Counter' ? [<CounterNode key="counter" node={node} onUpdate={onUpdateData} />] :
                                                                    node.type === 'Sticker' ? [<StickerNode key="sticker" node={node} onUpdate={onUpdateData} />] :
                                                                        node.type === 'Progress' ? [<ProgressNode key="prog" node={node} onUpdate={onUpdateData} />] :
                                                                            node.type === 'Rating' ? [<RatingNode key="rate" node={node} onUpdate={onUpdateData} />] :
                                                                                node.type === 'Shape' ? [<ShapeNode key="shape" node={node} onUpdate={onUpdateData} />] :
                                                                                    node.type === 'Avatar' ? [<AvatarNode key="avatar" node={node} onUpdate={onUpdateData} />] :
                                                                                        node.type === 'Kanban' ? [<KanbanNode key="kanban" node={node} onUpdate={onUpdateData} />] :
                                                                                            node.type === 'Clock' ? [<ClockNode key="clock" node={node} onUpdate={onUpdateData} />] :
                                                                                                node.type === 'Quote' ? [<QuoteNode key="quote" node={node} onUpdate={onUpdateData} />] :
                                                                                                    node.type === 'Code' ? [<CodeNode key="code" node={node} onUpdate={onUpdateData} />] :
                                                                                                        node.type === 'Emoji' ? [<EmojiNode key="emoji" node={node} onUpdate={onUpdateData} />] :
                                                                                                            node.type === 'Pomodoro' ? [<PomodoroNode key="pomo" node={node} onUpdate={onUpdateData} />] :
                                                                                                                [<NoteNode key="note" node={node} onUpdate={onUpdateData} />],
                    (child) => React.cloneElement(child, { isSelected, isDragging })
                )}
            </div>

            {/* AI Suggestion Controls */}
            {isSuggested && (
                <div style={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 201, padding: '8px 12px', background: 'white', borderRadius: 24, boxShadow: '0 4px 15px rgba(0,0,0,0.2)', border: '1px solid #eee' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#7928ca', marginRight: 5, display: 'flex', alignItems: 'center' }}><BsStars style={{ marginRight: 5 }} /> Suggested</span>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onUpdateData(node.id, { aiStatus: 'accepted' }) }} style={{ background: '#52c41a', color: 'white', border: 'none', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 }}><FiCheck /> Keep</motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onDelete(node.id) }} style={{ background: '#ff4d4f', color: 'white', border: 'none', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 }}><FiX /> Discard</motion.button>
                </div>
            )}

            {(isHovered || isSelected) && !isDragging && !isSuggested && (
                <div style={{ position: 'absolute', top: -45, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 200, padding: 8, background: 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onEdgeStart(node.id, e) }} title="Connect" style={{ width: 32, height: 32, borderRadius: 8, background: '#4facfe', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiLink size={16} /></motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onDelete(node.id) }} title="Delete" style={{ width: 32, height: 32, borderRadius: 8, background: '#ff4d4f', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiTrash2 size={16} /></motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onCopy([node.id]) }} title="Copy" style={{ width: 32, height: 32, borderRadius: 8, background: '#fdda6e', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiCopy size={16} /></motion.button>
                </div>
            )}
        </motion.div>
    )
}


export default function Whiteboard({ nodes, edges = [], pages, onAddNode, onUpdateNodePosition, onUpdateNodeData, onDeleteNode, onBatchDelete, onBatchUpdate, onCopy, onPaste, onMoveToPage, onAddEdge, onDeleteEdge, cursors, onCursorMove, onAIRequest, onSelectionChange, canvasSize = { w: 3000, h: 2000 }, onUpdateCanvasSize }) {
    const [scale, setScale] = useState(1); const [offset, setOffset] = useState({ x: 0, y: 0 })
    // Removed local canvasSize state
    const [showCanvasSetup, setShowCanvasSetup] = useState(false)

    const [selectedIds, setSelectedIds] = useState([])

    useEffect(() => {
        if (onSelectionChange) onSelectionChange(selectedIds)
    }, [selectedIds, onSelectionChange])
    const containerRef = useRef()
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)
    const [toolboxTab, setToolboxTab] = useState('General')
    const [connectMode, setConnectMode] = useState(false)
    const [magnetMode, setMagnetMode] = useState(false)
    const [connectStartId, setConnectStartId] = useState(null)
    const [selectionBox, setSelectionBox] = useState(null)
    const [dragOverrides, setDragOverrides] = useState({}) // { [id]: {x, y} }

    // Pinch Zoom State
    const [pinchDist, setPinchDist] = useState(null)
    const [startScale, setStartScale] = useState(1)

    // Helper to clamp
    const clamp = (val, min, max) => Math.min(Math.max(val, min), max)

    const handleDragNode = (id, x, y) => {
        // Clamp Node to Canvas
        const n = nodes.find(n => n.id === id)
        const w = n ? n.w || 320 : 320
        const h = n ? n.h || 240 : 240
        const cx = clamp(x, 0, canvasSize.w - w)
        const cy = clamp(y, 0, canvasSize.h - h)
        setDragOverrides(prev => ({ ...prev, [id]: { ...(prev[id] || {}), x: cx, y: cy } }))
    }

    const handleDragEndNode = (id) => {
        setDragOverrides(prev => {
            const next = { ...prev }
            delete next[id]
            return next
        })
    }

    const autoArrange = () => {
        const cols = Math.ceil(Math.sqrt(nodes.length))
        const updates = nodes.map((node, i) => ({ id: node.id, data: { x: 150 + (i % cols) * 360, y: 150 + Math.floor(i / cols) * 360 } }))
        if (onBatchUpdate) onBatchUpdate(updates)
    }

    const handlePointerDown = (e) => {
        if (connectMode) return
        if (e.target === containerRef.current) {
            if (e.shiftKey) {
                const { left, top } = containerRef.current.getBoundingClientRect()
                const x = (e.clientX - left - offset.x) / scale
                const y = (e.clientY - top - offset.y) / scale
                setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y })
                e.target.setPointerCapture(e.pointerId)
            } else {
                setIsDraggingCanvas(true); e.target.setPointerCapture(e.pointerId)
                if (!e.ctrlKey) setSelectedIds([])
            }
        }
    }

    const [tempEdge, setTempEdge] = useState(null)

    const handlePointerMove = (e) => {
        if (onCursorMove) {
            const { left, top } = containerRef.current ? containerRef.current.getBoundingClientRect() : { left: 0, top: 0 }
            const cx = (e.clientX - left - offset.x) / scale
            const cy = (e.clientY - top - offset.y) / scale
            onCursorMove({ x: isNaN(cx) ? 0 : cx, y: isNaN(cy) ? 0 : cy, uid: 'me', timestamp: Date.now() })
        }

        if (selectionBox) {
            const { left, top } = containerRef.current.getBoundingClientRect()
            const x = (e.clientX - left - offset.x) / scale; const y = (e.clientY - top - offset.y) / scale
            setSelectionBox(prev => ({ ...prev, currentX: x, currentY: y }))
        } else if (tempEdge) {
            const { left, top } = containerRef.current.getBoundingClientRect()
            const x = (e.clientX - left - offset.x) / scale; const y = (e.clientY - top - offset.y) / scale
            setTempEdge(prev => ({ ...prev, to: { x, y } }))
        } else if (isDraggingCanvas) {
            setOffset(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }))
        }
    }

    const handlePointerUp = (e) => {
        if (selectionBox) {
            const minX = Math.min(selectionBox.startX, selectionBox.currentX); const maxX = Math.max(selectionBox.startX, selectionBox.currentX)
            const minY = Math.min(selectionBox.startY, selectionBox.currentY); const maxY = Math.max(selectionBox.startY, selectionBox.currentY)
            const hitIds = nodes.filter(n => {
                const nw = n.w || 320; const nh = n.h || 240
                return (n.x < maxX && n.x + nw > minX && n.y < maxY && n.y + nh > minY)
            }).map(n => n.id)
            setSelectedIds(hitIds)
            setSelectionBox(null)
        }
        if (tempEdge) {
            // Find hit node
            const { left, top } = containerRef.current.getBoundingClientRect()
            const x = (e.clientX - left - offset.x) / scale; const y = (e.clientY - top - offset.y) / scale
            const hitNode = nodes.find(n => x > n.x && x < n.x + (n.w || 320) && y > n.y && y < n.y + (n.h || 240))
            if (hitNode && hitNode.id !== tempEdge.from) {
                onAddEdge(tempEdge.from, hitNode.id)
            }
            setTempEdge(null)
        }
        setIsDraggingCanvas(false)
        if (e.target) e.target.releasePointerCapture(e.pointerId)
    }

    const handleNodeUpdatePos = (id, delta) => {
        if (selectedIds.includes(id) && selectedIds.length > 1) {
            const updates = selectedIds.map(sId => {
                const n = nodes.find(n => n.id === sId)
                if (!n) return null
                return { id: sId, data: { x: n.x + delta.x, y: n.y + delta.y } }
            }).filter(Boolean)
            if (onBatchUpdate) onBatchUpdate(updates)
        } else {
            onUpdateNodePosition(id, delta)
        }
    }

    const handleNodeConnect = (id) => {
        if (!connectMode) {
            if (selectedIds.includes(id) && e.ctrlKey) return
            setSelectedIds([id])
            return
        }
        if (!connectStartId) { setConnectStartId(id) }
        else {
            if (connectStartId !== id) { onAddEdge(connectStartId, id); setConnectMode(false); setConnectStartId(null) }
            else { setConnectStartId(null) }
        }
    }

    // Pinch Zoom Handlers
    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
            setPinchDist(d); setStartScale(scale)
        }
    }
    const handleTouchMove = (e) => {
        if (e.touches.length === 2 && pinchDist) {
            const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
            setScale(Math.min(Math.max(startScale * (d / pinchDist), 0.2), 5))
        }
    }
    const handleTouchEnd = () => setPinchDist(null)

    // Native wheel listener to prevent browser zoom
    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        const onWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
                const s = e.deltaY > 0 ? 0.9 : 1.1
                // Calculate min scale to fit the entire canvas
                const fitScale = Math.min(
                    window.innerWidth / (canvasSize.w || 3000),
                    window.innerHeight / (canvasSize.h || 2000)
                )
                // Allow zooming out to fit the canvas, or down to 0.1, whichever is smaller
                const minScale = Math.min(fitScale, 0.1)

                setScale(prev => Math.min(Math.max(prev * s, minScale), 5))
            } else {
                e.preventDefault()
                setOffset(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
            }
        }
        container.addEventListener('wheel', onWheel, { passive: false })
        return () => container.removeEventListener('wheel', onWheel)
    }, [canvasSize])

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null) // {x, y, type, targetId}

    const handleNodeContextMenu = (e, id) => {
        e.preventDefault()
        e.stopPropagation()
        setContextMenu({ x: e.clientX, y: e.clientY, type: 'node', targetId: id })
        if (!selectedIds.includes(id)) {
            setSelectedIds([id])
        }
    }

    const handleBgContextMenu = (e) => {
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY, type: 'bg' })
    }

    const closeMenu = () => setContextMenu(null)

    // Close menu on click elsewhere
    useEffect(() => {
        const h = () => closeMenu()
        window.addEventListener('click', h)
        return () => window.removeEventListener('click', h)
    }, [])

    const getTargets = () => {
        if (!contextMenu || contextMenu.type !== 'node') return []
        return selectedIds.includes(contextMenu.targetId) ? selectedIds : [contextMenu.targetId]
    }

    // Toolbox State
    const [toolboxOpen, setToolboxOpen] = useState(false)
    const [embedModal, setEmbedModal] = useState(null) // { provider: 'Spotify', url: '' }

    const promptEmbed = (provider, defaultUrl) => {
        setEmbedModal({ provider, url: defaultUrl || '' })
        setToolboxOpen(false)
    }

    const handleEmbedSubmit = (e) => {
        e.preventDefault()
        if (embedModal && embedModal.url) {
            let finalSrc = embedModal.url.trim()

            // 1. Handle Iframe Code
            if (finalSrc.includes('<iframe')) {
                const srcMatch = finalSrc.match(/src=["']([^"']+)["']/)
                if (srcMatch) finalSrc = srcMatch[1]
            }
            // 2. Handle Auto-Convert (Spotify & YouTube)
            else {
                // Spotify: open.spotify.com/track/ID -> open.spotify.com/embed/track/ID
                if (finalSrc.includes('open.spotify.com') && !finalSrc.includes('/embed/')) {
                    finalSrc = finalSrc.replace('open.spotify.com', 'open.spotify.com/embed')
                }
                // YouTube: watch?v=ID -> embed/ID
                else if (finalSrc.includes('youtube.com/watch')) {
                    const videoId = new URL(finalSrc).searchParams.get('v')
                    if (videoId) finalSrc = `https://www.youtube.com/embed/${videoId}`
                }
                // YouTube: youtu.be/ID -> embed/ID
                else if (finalSrc.includes('youtu.be/')) {
                    const videoId = finalSrc.split('youtu.be/')[1].split('?')[0]
                    if (videoId) finalSrc = `https://www.youtube.com/embed/${videoId}`
                }
            }

            addCenteredNode('Embed', '', { src: finalSrc, title: embedModal.provider })
            setEmbedModal(null)
        }
    }

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return


            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedIds.length > 0) {
                    if (onBatchDelete) onBatchDelete(selectedIds)
                    else selectedIds.forEach(id => onDeleteNode(id))
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault()
                setSelectedIds(nodes.map(n => n.id))
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                e.preventDefault()
                if (selectedIds.length > 0) onCopy(selectedIds)
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                e.preventDefault()
                onPaste(mousePos.current.x, mousePos.current.y)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedIds, onBatchDelete, onDeleteNode, onCopy, onPaste, nodes])

    // Helper to add node at CENTER of viewport
    const addCenteredNode = (type, content = '', extra = {}) => {
        const cx = (window.innerWidth / 2 - offset.x) / scale
        const cy = ((window.innerHeight) / 2 - offset.y) / scale
        const w = extra.w || 250 // Approx default width
        const h = extra.h || 100
        onAddNode(type, content, { ...extra, x: cx - w / 2, y: cy - h / 2 })
    }

    const mousePos = useRef({ x: 0, y: 0 })
    const handleGlobalMouseMove = (e) => {
        const { left, top } = containerRef.current ? containerRef.current.getBoundingClientRect() : { left: 0, top: 0 }
        const wx = (e.clientX - left - offset.x) / scale; const wy = (e.clientY - top - offset.y) / scale
        mousePos.current = { x: wx, y: wy }
        if (onCursorMove) onCursorMove(wx, wy)
    }

    return (

        <div ref={containerRef} onPointerDown={handlePointerDown} onPointerMove={(e) => { handlePointerMove(e); handleGlobalMouseMove(e) }} onPointerUp={handlePointerUp} onContextMenu={handleBgContextMenu} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ width: '100%', height: '100%', overflow: 'hidden', background: 'transparent', position: 'relative', touchAction: 'none', cursor: connectMode ? 'crosshair' : (isDraggingCanvas ? 'grabbing' : 'default') }}>
            <div style={{
                position: 'absolute', left: 0, top: 0,
                width: canvasSize.w, height: canvasSize.h,
                background: 'rgba(255, 255, 255, 0.4)', // Premium Translucency
                backdropFilter: 'blur(40px)', // The "Frost" Key
                borderRadius: 32,
                boxShadow: '0 0 0 1px rgba(255,255,255,0.2), 0 30px 80px rgba(0,0,0,0.1)', // Deeper shadow
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0',
                pointerEvents: 'none'
            }}>
                <div className="grid-bg" style={{ width: '100%', height: '100%', backgroundImage: 'radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.8 }} />
            </div>

            <motion.div style={{ width: '100%', height: '100%', x: offset.x, y: offset.y, scale, transformOrigin: '0 0', pointerEvents: 'none' }}>
                <ConnectionLayer nodes={nodes} edges={edges} onDeleteEdge={onDeleteEdge} mode={connectMode ? 'view' : 'delete'} tempEdge={tempEdge} dragOverrides={dragOverrides} />
                {nodes.map(node => {
                    const override = dragOverrides[node.id]
                    const effectiveNode = override ? { ...node, ...override } : node
                    return (
                        <DraggableNode key={node.id} magnetMode={magnetMode} canvasSize={canvasSize} node={effectiveNode} scale={scale} isSelected={selectedIds.includes(node.id) || connectStartId === node.id}
                            onDrag={(id, x, y) => {
                                if (magnetMode) {
                                    const SNAP_DIST = 10
                                    const w = node.w || 320; const h = node.h || 240
                                    // Find closest snap lines from OTHER nodes
                                    const others = nodes.filter(n => n.id !== id)
                                    let snappedX = x; let snappedY = y

                                    for (const other of others) {
                                        const ow = other.w || 320; const oh = other.h || 240
                                        // X-Axis Snapping (Left-Left, Right-Right, Left-Right, Right-Left)
                                        if (Math.abs(x - other.x) < SNAP_DIST) snappedX = other.x // L-L
                                        else if (Math.abs(x - (other.x + ow)) < SNAP_DIST) snappedX = other.x + ow // L-R
                                        else if (Math.abs((x + w) - other.x) < SNAP_DIST) snappedX = other.x - w // R-L
                                        else if (Math.abs((x + w) - (other.x + ow)) < SNAP_DIST) snappedX = other.x + ow - w // R-R

                                        // Y-Axis Snapping (Top-Top, Bottom-Bottom, Top-Bottom, Bottom-Top)
                                        if (Math.abs(y - other.y) < SNAP_DIST) snappedY = other.y // T-T
                                        else if (Math.abs(y - (other.y + oh)) < SNAP_DIST) snappedY = other.y + oh // T-B
                                        else if (Math.abs((y + h) - other.y) < SNAP_DIST) snappedY = other.y - h // B-B
                                        else if (Math.abs((y + h) - (other.y + oh)) < SNAP_DIST) snappedY = other.y + oh - h // B-B
                                    }
                                    handleDragNode(id, snappedX, snappedY)
                                } else {
                                    handleDragNode(id, x, y)
                                }
                            }}
                            onResize={(id, bounds) => {
                                setDragOverrides(prev => ({ ...prev, [id]: { ...prev[id], ...bounds } }))
                            }}
                            onResizeEnd={handleDragEndNode}
                            onDragEnd={handleDragEndNode}
                            onSelect={(e) => { if (connectMode) handleNodeConnect(node.id); else if (e.shiftKey || e.ctrlKey) setSelectedIds(pre => [...pre, node.id]); else setSelectedIds([node.id]) }}
                            onConnectStart={connectMode ? ((id) => { if (connectStartId) { onAddEdge(connectStartId, id); setConnectStartId(null); setConnectMode(false) } else { setConnectStartId(id) } }) : null}
                            onEdgeStart={(id, e) => {
                                const startX = (e.clientX - offset.x) / scale; const startY = (e.clientY - offset.y) / scale
                                const { left, top } = containerRef.current.getBoundingClientRect()
                                setTempEdge({ from: id, to: { x: (e.clientX - left - offset.x) / scale, y: (e.clientY - top - offset.y) / scale } })
                                const onEdgeMove = (me) => {
                                    const mx = (me.clientX - left - offset.x) / scale; const my = (me.clientY - top - offset.y) / scale
                                    setTempEdge(prev => prev ? ({ ...prev, to: { x: mx, y: my } }) : null)
                                }
                                const onEdgeUp = (ue) => {
                                    window.removeEventListener('pointermove', onEdgeMove); window.removeEventListener('pointerup', onEdgeUp)
                                    const ux = (ue.clientX - left - offset.x) / scale; const uy = (ue.clientY - top - offset.y) / scale
                                    const hitNode = nodes.find(n => ux >= n.x && ux <= n.x + (n.w || 320) && uy >= n.y && uy <= n.y + (n.h || 240))
                                    if (hitNode && hitNode.id !== id) { onAddEdge(id, hitNode.id) }
                                    setTempEdge(null)
                                }
                                window.addEventListener('pointermove', onEdgeMove); window.addEventListener('pointerup', onEdgeUp)
                            }}
                            onUpdatePosition={handleNodeUpdatePos} onUpdateData={onUpdateNodeData} onDelete={onDeleteNode} onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
                        />
                    )
                })}{cursors && Object.values(cursors).filter(c => Date.now() - (c.timestamp || Date.now()) < 60000 || !c.timestamp).map(c => (
                    <div key={c.uid} style={{ position: 'absolute', left: c.x, top: c.y, pointerEvents: 'none', zIndex: 9999, transition: 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill={c.color || '#2563eb'} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>
                            <path d="M3 3l7.5 18.5 3.5-8 8-3.5L3 3z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                        <div style={{
                            background: c.color || '#2563eb', color: 'white', padding: '4px 8px',
                            borderRadius: '6px 20px 20px 20px', fontSize: '0.75rem', fontWeight: 700,
                            marginTop: 4, whiteSpace: 'nowrap', transform: 'translateX(12px) translateY(-5px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}>
                            {c.displayName || 'Guest'}
                        </div>
                    </div>
                ))}
                {selectionBox && (
                    <div style={{
                        position: 'absolute',
                        left: Math.min(selectionBox.startX, selectionBox.currentX),
                        top: Math.min(selectionBox.startY, selectionBox.currentY),
                        width: Math.abs(selectionBox.currentX - selectionBox.startX),
                        height: Math.abs(selectionBox.currentY - selectionBox.startY),
                        background: 'rgba(37, 99, 235, 0.08)',
                        border: '1px solid rgba(37, 99, 235, 0.6)',
                        borderRadius: 4,
                        pointerEvents: 'none',
                        zIndex: 2000
                    }} />
                )}
            </motion.div>

            {contextMenu && (
                <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 1000, padding: 6, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {contextMenu.type === 'node' ? (
                        <>
                            <button onClick={() => { onCopy(getTargets()); if (onBatchDelete) onBatchDelete(getTargets()); closeMenu() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem', color: '#333' }} onMouseEnter={e => e.target.style.background = '#f0f0f0'} onMouseLeave={e => e.target.style.background = 'transparent'}><FiScissors /> Cut</button>
                            <button onClick={() => { onCopy(getTargets()); closeMenu() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem', color: '#333' }} onMouseEnter={e => e.target.style.background = '#f0f0f0'} onMouseLeave={e => e.target.style.background = 'transparent'}><FiCopy /> Copy</button>
                            <button onClick={() => { onCopy(getTargets()); setTimeout(() => onPaste(contextMenu.x + 20, contextMenu.y + 20), 100); closeMenu() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem', color: '#333' }} onMouseEnter={e => e.target.style.background = '#f0f0f0'} onMouseLeave={e => e.target.style.background = 'transparent'}><FiLayers /> Duplicate</button>
                            <button onClick={() => { onAIRequest(getTargets()[0], 'improve'); closeMenu() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transarent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem', color: '#6e8efb', fontWeight: 600 }} onMouseEnter={e => e.target.style.background = '#f0f0f0'} onMouseLeave={e => e.target.style.background = 'transparent'}><BsStars /> AI Enhance</button>
                            <button onClick={() => { const t = getTargets(); if (onBatchDelete) onBatchDelete(t); else t.forEach(id => onDeleteNode(id)); closeMenu() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem', color: '#ff4d4f' }} onMouseEnter={e => e.target.style.background = '#fff1f0'} onMouseLeave={e => e.target.style.background = 'transparent'}><FiTrash2 /> Delete {getTargets().length > 1 && `(${getTargets().length})`}</button>

                            <div style={{ height: 1, background: '#eee', margin: '4px 0' }} />
                            <div style={{ padding: '4px 12px', fontSize: '0.75rem', color: '#999', fontWeight: 'bold' }}>MOVE TO PAGE</div>
                            <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {pages.map(p => (
                                    <button key={p} onClick={() => { onMoveToPage(getTargets(), p); closeMenu() }} style={{ display: 'block', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem', color: '#555' }} onMouseEnter={e => e.target.style.background = '#f0f0f0'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                                        <FiArrowRight style={{ marginRight: 5, verticalAlign: 'middle' }} /> {p}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <button onClick={() => { onPaste(contextMenu.x, contextMenu.y); closeMenu() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem', color: '#333' }} onMouseEnter={e => e.target.style.background = '#f0f0f0'} onMouseLeave={e => e.target.style.background = 'transparent'}><FiClipboard /> Paste Here</button>
                            <button onClick={() => { autoArrange(); closeMenu() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: '0.9rem', color: '#333' }} onMouseEnter={e => e.target.style.background = '#f0f0f0'} onMouseLeave={e => e.target.style.background = 'transparent'}><FiGrid /> Auto Arrange</button>
                        </>
                    )}
                </div>
            )}

            {/* --- Toolbox Menu --- */}
            <AnimatePresence>
                {toolboxOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        style={{
                            position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
                            background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(16px)',
                            padding: '16px', borderRadius: 24,
                            boxShadow: '0 20px 50px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.5) inset',
                            zIndex: 100, minWidth: 320, maxWidth: 400
                        }}
                    >
                        <div style={{ marginBottom: 12, display: 'flex', gap: 8, borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 8, overflowX: 'auto' }}>
                            {['General', 'Interaction', 'Media', 'Visuals'].map(tab => (
                                <button key={tab}
                                    onClick={() => setToolboxTab(tab)}
                                    style={{
                                        background: toolboxTab === tab ? '#333' : 'transparent',
                                        color: toolboxTab === tab ? 'white' : '#777',
                                        padding: '6px 14px', borderRadius: 20, border: 'none',
                                        fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: '0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxHeight: 300, overflowY: 'auto', padding: 4 }}>
                            {[
                                // General
                                { id: 'link', label: 'Bookmark', category: 'General', icon: <FiGlobe size={24} color="#3498db" />, action: () => { addCenteredNode('Link'); setToolboxOpen(false) } },
                                { id: 'label', label: 'Label', category: 'General', icon: <FiType size={24} color="#333" />, action: () => { addCenteredNode('Label', 'Heading'); setToolboxOpen(false) } },
                                { id: 'section', label: 'Section', category: 'General', icon: <FiLayout size={24} color="#9b59b6" />, action: () => { addCenteredNode('Section', '', { w: 400, h: 300 }); setToolboxOpen(false) } },
                                { id: 'timer', label: 'Timer', category: 'General', icon: <FiClock size={24} color="#f39c12" />, action: () => { addCenteredNode('Timer', '', { duration: 300 }); setToolboxOpen(false) } },
                                { id: 'clock', label: 'Clock', category: 'General', icon: <FiClock size={24} color="#ff9f43" />, action: () => { addCenteredNode('Clock'); setToolboxOpen(false) } },
                                { id: 'pomodoro', label: 'Pomodoro', category: 'General', icon: <FiCheckCircle size={24} color="#ee5253" />, action: () => { addCenteredNode('Pomodoro'); setToolboxOpen(false) } },

                                // Interaction
                                { id: 'poll', label: 'Poll', category: 'Interaction', icon: <FiBarChart2 size={24} color="#007bff" />, action: () => { addCenteredNode('Poll'); setToolboxOpen(false) } },
                                { id: 'counter', label: 'Counter', category: 'Interaction', icon: <FiPlus size={24} color="#52c41a" />, action: () => { addCenteredNode('Counter', '', { count: 0 }); setToolboxOpen(false) } },
                                { id: 'rating', label: 'Rating', category: 'Interaction', icon: <FiStar size={24} color="#feca57" />, action: () => { addCenteredNode('Rating', '', { rating: 3 }); setToolboxOpen(false) } },
                                { id: 'progress', label: 'Progress', category: 'Interaction', icon: <FiActivity size={24} color="#00d2d3" />, action: () => { addCenteredNode('Progress', '', { progress: 50 }); setToolboxOpen(false) } },
                                { id: 'kanban', label: 'Kanban', category: 'Interaction', icon: <FiColumns size={24} color="#5f27cd" />, action: () => { addCenteredNode('Kanban', '', { w: 300, h: 400 }); setToolboxOpen(false) } },
                                { id: 'notify', label: 'Notify', category: 'Interaction', icon: <FiBell size={24} color="#667eea" />, action: () => { addCenteredNode('Notify'); setToolboxOpen(false) } },

                                // Media
                                { id: 'youtube', label: 'YouTube', category: 'Media', icon: <FiYoutube size={24} color="#FF0000" />, action: () => { addCenteredNode('YouTube'); setToolboxOpen(false) } },
                                { id: 'spotify', label: 'Spotify', category: 'Media', icon: <FiMusic size={24} color="#1DB954" />, action: () => promptEmbed('Spotify', 'https://open.spotify.com/embed/track/...') },
                                { id: 'bandlab', label: 'BandLab', category: 'Media', icon: <FiMic size={24} color="#F50" />, action: () => promptEmbed('BandLab', 'https://www.bandlab.com/embed/...') },
                                { id: 'code', label: 'Code', category: 'Media', icon: <FiTerminal size={24} color="#222f3e" />, action: () => { addCenteredNode('Code', '', { w: 400, h: 300 }); setToolboxOpen(false) } },
                                { id: 'generic', label: 'Embed', category: 'Media', icon: <FiCode size={24} color="#333" />, action: () => promptEmbed('Embed', 'Paste URL or <iframe> code') },

                                // Visuals
                                { id: 'sticker', label: 'Sticker', category: 'Visuals', icon: <FiSmile size={24} color="#f1c40f" />, action: () => { addCenteredNode('Sticker', '😎'); setToolboxOpen(false) } },
                                { id: 'emoji', label: 'Emoji', category: 'Visuals', icon: <FiSmile size={24} color="#ff9ff3" />, action: () => { addCenteredNode('Emoji', '', { w: 250, h: 100 }); setToolboxOpen(false) } },
                                { id: 'shape', label: 'Shape', category: 'Visuals', icon: <FiCircle size={24} color="#54a0ff" />, action: () => { addCenteredNode('Shape'); setToolboxOpen(false) } },
                                { id: 'avatar', label: 'Avatar', category: 'Visuals', icon: <FiUser size={24} color="#c8d6e5" />, action: () => { addCenteredNode('Avatar'); setToolboxOpen(false) } },
                                { id: 'quote', label: 'Quote', category: 'Visuals', icon: <FiMessageSquare size={24} color="#ff6b6b" />, action: () => { addCenteredNode('Quote'); setToolboxOpen(false) } },
                                { id: 'dice', label: 'Dice', category: 'Visuals', icon: <FiGrid size={24} color="#e74c3c" />, action: () => { addCenteredNode('Dice'); setToolboxOpen(false) } },
                            ].filter(item => item.category === toolboxTab).map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    onClick={item.action}
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
                                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.06)' }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '12px 8px', borderRadius: 16, background: 'rgba(0,0,0,0.02)' }}
                                >
                                    <div style={{ width: 48, height: 48, background: 'white', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>{item.icon}</div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#555' }}>{item.label}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div className="glass-panel" style={{ position: 'absolute', bottom: useMediaQuery('(max-width: 768px)') ? 85 : 30, left: '50%', x: '-50%', padding: '12px 24px', display: 'flex', gap: 20, borderRadius: 24, zIndex: 100, pointerEvents: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', maxWidth: '90vw', overflowX: 'auto' }} initial={{ y: 100 }} animate={{ y: 0 }}>
                <ToolBtn icon={<FiType />} label="Note" onClick={() => addCenteredNode('Note')} />
                <ToolBtn icon={<FiCheckSquare />} label="Todo" onClick={() => addCenteredNode('Todo')} />
                <ToolBtn icon={<FiCalendar />} label="Calendar" onClick={() => addCenteredNode('Calendar')} />
                <ToolBtn icon={<FiImage />} label="Image" onClick={() => addCenteredNode('Image')} />
                <div style={{ width: 1, height: 40, background: '#e0e0e0', margin: '0 5px' }}></div>
                <ToolBtn icon={<FiTarget />} label="Magnet" active={magnetMode} onClick={() => setMagnetMode(!magnetMode)} />
                <ToolBtn icon={<FiGrid />} label="Toolbox" active={toolboxOpen} onClick={() => setToolboxOpen(!toolboxOpen)} />
                <div style={{ width: 1, height: 40, background: '#e0e0e0', margin: '0 5px' }}></div>
                <ToolBtn icon={<FiMaximize2 />} label="Canvas Size" onClick={() => setShowCanvasSetup(true)} />
                <div style={{ width: 1, height: 40, background: '#e0e0e0', margin: '0 5px' }}></div>
                <ToolBtn icon={<FiLayout />} label="Auto Arrange" onClick={autoArrange} />
            </motion.div>

            {/* Canvas Size Modal */}
            <AnimatePresence>
                {showCanvasSetup && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCanvasSetup(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'white', padding: 24, borderRadius: 20, width: 320 }} onClick={e => e.stopPropagation()}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 10 }}><FiMaximize2 /> Canvas Size</div>
                            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 4 }}>Width (px)</div>
                                    <input type="number" defaultValue={(canvasSize?.w || 3000)} id="canvas-w-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', outline: 'none', fontSize: '1rem' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 4 }}>Height (px)</div>
                                    <input type="number" defaultValue={(canvasSize?.h || 2000)} id="canvas-h-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', outline: 'none', fontSize: '1rem' }} />
                                </div>
                            </div>
                            <button onClick={() => {
                                const w = parseInt(document.getElementById('canvas-w-input').value) || 3000
                                const h = parseInt(document.getElementById('canvas-h-input').value) || 2000
                                if (onUpdateCanvasSize) onUpdateCanvasSize(w, h)
                                setShowCanvasSetup(false)
                            }} style={{ width: '100%', background: '#007bff', color: 'white', border: 'none', padding: 12, borderRadius: 12, fontWeight: 'bold', cursor: 'pointer' }}>Done</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {connectMode && <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#007bff', color: 'white', padding: '10px 20px', borderRadius: 20, fontWeight: 'bold' }}>Select two nodes to connect</div>}

            {/* --- Embed Modal --- */}
            <AnimatePresence>
                {embedModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
                        onClick={() => setEmbedModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            style={{ background: 'white', padding: 24, borderRadius: 24, width: '90%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#333' }}>Add {embedModal.provider}</h3>
                            <form onSubmit={handleEmbedSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>URL or Embed Code</label>
                                    <input
                                        autoFocus
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #ddd', fontSize: '1rem', outline: 'none', background: '#f9f9f9', transition: '0.2s' }}
                                        placeholder={embedModal.provider === 'Spotify' ? 'Spotify Track/Album URL' : 'Paste Embed Code or URL'}
                                        value={embedModal.url}
                                        onChange={e => setEmbedModal({ ...embedModal, url: e.target.value })}
                                        onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#4facfe'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 172, 254, 0.2)' }}
                                        onBlur={e => { e.target.style.background = '#f9f9f9'; e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none' }}
                                    />
                                    {embedModal.provider !== 'Embed' && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                            <button type="button" onClick={() => {
                                                const urls = { 'Spotify': 'https://open.spotify.com', 'BandLab': 'https://www.bandlab.com', 'YouTube': 'https://www.youtube.com' }
                                                window.open(urls[embedModal.provider] || 'https://google.com', '_blank')
                                            }} style={{ background: 'transparent', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <FiGlobe /> Open {embedModal.provider}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                    <button type="button" onClick={() => setEmbedModal(null)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#f0f0f0', color: '#666', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: 'white', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 172, 254, 0.4)' }}>Embed</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
