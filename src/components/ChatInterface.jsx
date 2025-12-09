import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BsStars, BsMic, BsMicFill, BsSend } from 'react-icons/bs'
import { FiX } from 'react-icons/fi'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { db } from '../firebase'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'

const SYSTEM_PROMPT = `You are an expert Project Manager & Board Architect AI for IdeaBomb.
Today is {{TODAY}}. Your goal is to create COMPREHENSIVE, ACTIONABLE, and VISUALLY ORGANIZED plans.

STRICT RULES FOR CONTENT:
1. NEVER create empty nodes. Content MUST be rich and detailed.
   - For 'Todo' nodes: Aggregate ALL tasks into ONE single Todo Node for each phase. Do NOT split tasks into multiple nodes. Populate 'data.items' with 5+ items.
   - For 'Note' nodes: Use markdown for headers and bullet points.
   - For 'Calendar': Use specific dates. Keys MUST be 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm'.
     - If user says "12/10" and today is 2025, use "2025-12-10". DO NOT change the month (e.g. to Jan or Feb) unless requested.
     - If multiple events happen on the same day, include the time in the key (e.g. "2025-12-10 09:00").
   - **CRITICAL**: If the user request implies a schedule (e.g. 'Plan a wedding', 'Marketing timeline') but **LACKS specific dates**, ALWAYS ASK clarifying questions first (e.g. "What is the start date?", "When is the event?"). Do NOT generate a calendar with fake/random dates unless the user says "mock" or "example".
2. PROVIDE RESOURCES (CRITICAL):
   - You HAVE access to Google Search. You MUST Use it.
   - For 'Link' nodes: Search for the BEST real-world resource (e.g. official docs, viral article) and use the REAL URL. If NO valid URL is found, create a Note node instead. Do NOT use fake URLs.
   - For 'YouTube' nodes:
     - Search for a specific video.
     - You MUST verify the URL contains 'watch?v=' or is a valid ID.
     - IF UNCERTAIN or if the URL looks like an embed/tracker, Defaults to "Search: [Query]" content.
     - DO NOT provide links that are not standard Watch URLs.
   - **CRITICAL**: If you cannot find a valid URL or Video ID, set the content to "Search: [Query]" (e.g. "Search: SpaceX Launch") so the user can search. DO NOT HALLUCINATE IDs.

STRICT RULES FOR LAYOUT:
1. ARRANGE nodes logically (e.g., Left-to-Right timeline or Grid).
2. DO NOT overlap nodes. Use spacing of at least 400px horizontally and 300px vertically.
3. CONNECT nodes in a logical flow (e.g., Step 1 -> Step 2). Avoid crossing lines.
4. If the plan is complex, break it into Phases (columns).
1. Do NOT overlap nodes. Use 'x' and 'y' coordinates.
2. Use a Workflow or Grid layout.
   - Horizontal spacing: ~400px. Vertical spacing: ~300px.
   - Start at x: 100, y: 100.
3. Logical Flow: Connect steps with 'create_edge'.

RESPONSE FORMAT: Return ONLY a Raw JSON Array. Do NOT use markdown code blocks. Do NOT add conversational text.
    Example:
        [
            { "action": "create_node", "id": "n1", "nodeType": "Note", "content": "# Project Goal\nLaunch new marketing campaign.", "x": 100, "y": 100 },
            { "action": "create_node", "id": "n2", "nodeType": "Todo", "content": "Phase 1: Research", "x": 500, "y": 100, "data": { "items": [{ "text": "Analyze trends", "done": false }, { "text": "Define persona", "done": true }] } },
            { "action": "create_edge", "from": "n1", "to": "n2" },
            { "action": "create_link", "id": "n3", "url": "https://www.google.com/search?q=Marketing+Trends+2025", "x": 500, "y": 400 }
        ]

For calendar / planning, use create_calendar_plan with events object.
If the user just wants to chat, respond with a friendly message(no JSON needed).`

export default function ChatInterface({ boardId, user, onAction, nodes, collaborators }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const messagesEndRef = useRef(null)

    // Sync Messages
    useEffect(() => {
        if (!boardId) return
        const q = query(collection(db, 'boards', boardId, 'messages'), orderBy('createdAt', 'asc'))
        const unsub = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(d => d.data())
            if (msgs.length === 0) {
                setMessages([{ role: 'system', content: 'Welcome to Team Chat! Mention @ai to get help.' }])
            } else {
                setMessages(msgs)
            }
        })
        return unsub
    }, [boardId])

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isOpen])

    // Speech Recognition Setup
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Voice recognition is not supported in this browser.")
            return
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US' // Default to English, could be configurable

        recognition.onstart = () => setIsListening(true)
        recognition.onend = () => setIsListening(false)
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript
            setInput(prev => prev ? prev + ' ' + transcript : transcript)
        }
        recognition.start()
    }

    const handleSend = async () => {
        if (!input.trim() || !user || !boardId || isLoading) return

        if (input.toLowerCase().includes('@ai')) {
            const now = Date.now()
            const history = JSON.parse(localStorage.getItem('ai_usage_history') || '[]').filter(t => now - t < 3600000)
            const lastUsed = parseInt(localStorage.getItem('ai_last_used') || '0', 10)

            if (now - lastUsed < 30000) {
                alert("Please wait 30 seconds before triggering AI again.")
                return
            }
            if (history.length >= 10) {
                alert("Hourly AI limit reached (10 requests/hour).")
                return
            }
            localStorage.setItem('ai_last_used', now.toString())
            localStorage.setItem('ai_usage_history', JSON.stringify([...history, now]))
        }

        const userMsg = input
        setInput('')

        // Optimistic add not needed since onSnapshot will catch it
        await addDoc(collection(db, 'boards', boardId, 'messages'), {
            role: 'user',
            content: userMsg,
            createdAt: serverTimestamp(),
            sender: user.displayName || 'User',
            uid: user.uid,
            photoURL: user.photoURL
        })

        // Check for AI Trigger
        if (userMsg.toLowerCase().includes('@ai')) {
            // Add Loading Indicator (Ephemeral?) Or just handle in UI
            // Actually, we can add a 'system' message or just rely on isLoading
            setIsLoading(true)
            try {
                const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
                const model = genAI.getGenerativeModel({
                    model: "models/gemini-2.5-flash-lite",
                    tools: [{ googleSearch: {} }]
                })

                // Context Construction
                const historyContext = messages.slice(-10).map(m => `${m.sender || m.role}: ${m.content}`).join('\n')
                const boardContext = nodes.map(n => `- ${n.type}: ${n.content}`).join('\n').slice(0, 3000)

                const prompt = SYSTEM_PROMPT.replace('{{TODAY}}', new Date().toDateString()) +
                    `\n\nCONTEXT:\nCollaborators: ${collaborators.map(c => c.displayName).join(', ')}\nChat History:\n${historyContext}\nBoard Content Summary:\n${boardContext}\n\nUser Request: ${userMsg} (Respond as IdeaBomb AI)`

                const result = await model.generateContent(prompt)
                const response = result.response.text()

                // Extract JSON
                let cleanText = response.replace(/```json/g, '').replace(/```/g, '').trim()
                const jsonMatch = cleanText.match(/\[.*\]/s)

                if (jsonMatch) {
                    try {
                        const actions = JSON.parse(jsonMatch[0])
                        onAction(actions)
                        // Add AI Response
                        await addDoc(collection(db, 'boards', boardId, 'messages'), {
                            role: 'model',
                            content: "I've executed the plan based on the chat.",
                            createdAt: serverTimestamp(),
                            sender: 'IdeaBomb AI',
                            isAI: true
                        })
                    } catch (e) {
                        await addDoc(collection(db, 'boards', boardId, 'messages'), {
                            role: 'model', content: response, createdAt: serverTimestamp(), sender: 'IdeaBomb AI', isAI: true
                        })
                    }
                } else {
                    await addDoc(collection(db, 'boards', boardId, 'messages'), {
                        role: 'model', content: response, createdAt: serverTimestamp(), sender: 'IdeaBomb AI', isAI: true
                    })
                }
            } catch (error) {
                console.error("AI Error:", error)
                let errorMsg = "Sorry, I had trouble processing that request."
                if (error.message.includes('429') || error.message.includes('Quota')) {
                    errorMsg = "Updates are paused temporarily (Rate Limit). Please try again in 10-20 seconds."
                }
                await addDoc(collection(db, 'boards', boardId, 'messages'), {
                    role: 'model', content: errorMsg, createdAt: serverTimestamp(), sender: 'IdeaBomb AI', isAI: true
                })
            } finally {
                setIsLoading(false)
            }
        }
    }

    return (
        <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', pointerEvents: 'none' }}>
            <AnimatePresence mode="wait">
                {isOpen ? (
                    <motion.div
                        key="chat-panel"
                        initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="glass-panel"
                        style={{
                            width: 360, height: 520, pointerEvents: 'auto',
                            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
                            borderRadius: '24px 24px 24px 8px', overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.5)',
                            display: 'flex', flexDirection: 'column'
                        }}
                    >
                        <div style={{ padding: '15px 20px', background: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BsStars size={20} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '1rem', lineHeight: '1.2' }}>Team Collaboration</span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 'normal', opacity: 0.9 }}>Type <strong>@ai</strong> for help</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.3)'}
                                onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
                            >
                                <FiX size={16} />
                            </button>
                        </div>

                        <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ background: 'rgba(0,0,0,0.05)', padding: '10px 15px', borderRadius: '15px 15px 15px 0', alignSelf: 'flex-start', maxWidth: '85%', fontSize: '0.9rem', lineHeight: 1.5, color: '#444' }}>
                                I am your Whiteboard Assistant. Try saying "Create a marketing plan"!
                            </div>
                            {messages.map((msg, i) => {
                                const isMe = msg.uid === user?.uid
                                const isAI = msg.role === 'model' || msg.isAI
                                const align = isMe ? 'flex-end' : 'flex-start'
                                return (
                                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ alignSelf: align, maxWidth: '85%', display: 'flex', flexDirection: 'column', alignItems: align }}>
                                        {!isMe && !isAI && <span style={{ fontSize: '0.7rem', color: '#666', marginBottom: 2, marginLeft: 4 }}>{msg.sender || 'User'}</span>}
                                        <div style={{
                                            background: isMe ? 'linear-gradient(135deg, #4facfe, #00f2fe)' : (isAI ? 'white' : '#f1f3f4'),
                                            color: isMe ? 'white' : '#333',
                                            padding: '10px 15px',
                                            borderRadius: isMe ? '15px 15px 0 15px' : '15px 15px 15px 0',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                            fontSize: '0.95rem',
                                            border: isAI ? '1px solid #eee' : 'none'
                                        }}>
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                )
                            })}
                            {isLoading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ alignSelf: 'flex-start', background: '#f0f0f0', padding: '8px 12px', borderRadius: 12, fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>Thinking...</motion.div>}
                            <div ref={messagesEndRef} />
                        </div>

                        <div style={{ padding: 15, background: 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 10 }}>
                            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder={isListening ? "Listening..." : "Ask AI to create..."}
                                    style={{ width: '100%', padding: '12px 40px 12px 15px', borderRadius: 24, border: '1px solid #ddd', outline: 'none', background: 'white', color: '#333', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.02)', fontSize: '0.95rem' }}
                                />
                                <button
                                    onClick={startListening}
                                    style={{
                                        position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)',
                                        background: isListening ? '#ff4d4f' : 'transparent',
                                        color: isListening ? 'white' : '#888',
                                        border: 'none', borderRadius: '50%', width: 32, height: 32,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        animation: isListening ? 'pulse 1.5s infinite' : 'none'
                                    }}
                                    title="Voice Input"
                                >
                                    {isListening ? <BsMicFill size={14} /> : <BsMic size={18} />}
                                </button>
                            </div>
                            <button onClick={handleSend} disabled={isLoading || (!input.trim() && !isListening)} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: isLoading ? '#ccc' : 'linear-gradient(135deg, #4facfe, #00f2fe)', color: 'white', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(79, 172, 254, 0.4)', flexShrink: 0 }}><BsSend size={18} /></button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        key="chat-fab"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        style={{
                            width: 65, height: 65, borderRadius: '24px 24px 8px 24px', pointerEvents: 'auto',
                            background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                            color: 'white', border: '4px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 10px 30px rgba(79, 172, 254, 0.4)'
                        }}
                    >
                        <BsStars size={30} />
                    </motion.button>
                )}
            </AnimatePresence>
            <style>{`@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255, 75, 75, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(255, 75, 75, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 75, 75, 0); } }`}</style>
        </div>
    )
}
