import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BsStars, BsMic, BsMicFill, BsSend } from 'react-icons/bs'
import { FiX } from 'react-icons/fi'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { db } from '../firebase'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'

const SYSTEM_PROMPT = `You are an expert Project Manager & Board Architect AI for IdeaBomb.
Today is {{TODAY}}. Your goal is to create COMPREHENSIVE, ACTIONABLE, and VISUALLY ORGANIZED plans.

STRICT DECISION LOGIC (CREATE vs UPDATE vs QUESTION):
1. IF the user asks to "Change", "Improve", "Expand", "Shorten", or "Fix" a SPECIFIC node (or the currently selected node):
   - ACTION: "update_node"
   - "id": The ID of the node to update.
   - "content": The NEW full content.
2. IF the user request is VAGUE or LACKS CRITICAL INFO (e.g. "Plan an event" without topic/date):
   - ACTION: "ask_question" (DO NOT ASK A LIST. Ask ONE key question).
   - "question": Short, clear question text.
   - "options": Array of 2-4 likely answers (strings).
   - "allow_generate": boolean (True if you can make a good guess instead).
3. IF the user asks to "Create", "Add", "Generate", or "Plan" something NEW and you have enough info:
   - ACTION: "create_node" (or "create_calendar_plan", etc.)
4. IF AMBIGUOUS:
   - If a node is SELECTED -> "update_node".
   - If nothing selected -> "create_node".

STRICT RULES FOR CONTENT:
1. NEVER create empty nodes. Content MUST be rich and detailed.
   - For 'Todo': Aggregate tasks. 5+ items.
   - For 'Calendar': Use 'YYYY-MM-DD'.
2. PROVIDE RESOURCES: Use Google Search for real URLs/Video IDs. If not found, use "Search: [Query]".

RESPONSE FORMAT: Return ONLY a Raw JSON Array.
    Example (Question):
        [{ "action": "ask_question", "question": "What is the event date?", "options": ["Next Week", "Next Month", "TBD"], "allow_generate": true }]

    Example (Update):
        [{ "action": "update_node", "id": "n1", "content": "# Updated..." }]

    Example (Create):
        [
            { "action": "create_node", "id": "n1", "nodeType": "Note", "content": "..." },
            { "action": "create_edge", "from": "n1", "to": "n2" }
        ]
`

export default function ChatInterface({ boardId, user, onAction, nodes, collaborators, selectedNodeIds = [] }) {
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

    // Scroll to bottom
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isOpen])

    // Speech Recognition Setup
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) { alert("Voice recognition is not supported."); return }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = false; recognition.interimResults = false; recognition.lang = 'en-US' // Default to English, could be configurable

        recognition.onstart = () => setIsListening(true); recognition.onend = () => setIsListening(false)
        recognition.onresult = (e) => { setInput(prev => prev ? prev + ' ' + e.results[0][0].transcript : e.results[0][0].transcript) }
        recognition.start()
    }

    const sendMessage = async (text, role = 'user', extraData = {}) => {
        if (!text && !extraData.isQuestion) return
        await addDoc(collection(db, 'boards', boardId, 'messages'), {
            role, content: text, createdAt: serverTimestamp(),
            sender: role === 'user' ? (user.displayName || 'User') : 'IdeaBomb AI',
            uid: role === 'user' ? user.uid : 'ai',
            photoURL: role === 'user' ? user.photoURL : null,
            ...extraData
        })
    }

    const handleSend = async (overrideInput = null) => {
        const textToSend = overrideInput !== null ? overrideInput : input
        if (!textToSend.trim() || !user || !boardId || isLoading) return

        if (!overrideInput) setInput('') // Clear input if manual send

        // Rate Limit Check
        if (textToSend.toLowerCase().includes('@ai')) {
            const now = Date.now()
            const history = JSON.parse(localStorage.getItem('ai_usage_history') || '[]').filter(t => now - t < 3600000)
            const lastUsed = parseInt(localStorage.getItem('ai_last_used') || '0', 10)
            if (now - lastUsed < 5000) { alert("Please wait a few seconds."); return } // 5s debounce
            if (history.length >= 20) { alert("Hourly AI limit reached."); return }
            localStorage.setItem('ai_last_used', now.toString())
            localStorage.setItem('ai_usage_history', JSON.stringify([...history, now]))
        }

        await sendMessage(textToSend, 'user')

        // AI Logic
        if (textToSend.toLowerCase().includes('@ai') || overrideInput) { // Assume overrides are AI-directed
            setIsLoading(true)
            try {
                const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
                const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash-lite", tools: [{ googleSearch: {} }] })

                // Context
                const historyContext = messages.slice(-10).map(m => `${m.sender || m.role}: ${m.content} ${m.question ? '(Asked Question)' : ''}`).join('\n')
                const boardContext = nodes.map(n => `- ${n.type} (ID: ${n.id}): ${n.content.substring(0, 100)}...`).join('\n').slice(0, 3000)
                let selectionContext = "No nodes selected."
                if (selectedNodeIds && selectedNodeIds.length > 0) {
                    const sNodes = nodes.filter(n => selectedNodeIds.includes(n.id))
                    selectionContext = `SELECTED NODES (${sNodes.length}):\n` + sNodes.map(n => `ID: ${n.id}\nContent: ${n.content}`).join('\n')
                }

                const prompt = SYSTEM_PROMPT.replace('{{TODAY}}', new Date().toDateString()) +
                    `\n\nCONTEXT:\nCollaborators: ${collaborators.map(c => c.displayName).join(', ')}\nChat History:\n${historyContext}\nBoard:\n${boardContext}\n${selectionContext}\n\nUser: ${textToSend} (Respond as IdeaBomb AI)`

                const result = await model.generateContent(prompt)
                const response = result.response.text()
                let cleanText = response.replace(/```json/g, '').replace(/```/g, '').trim()

                // Try JSON parsing
                let allActions = []
                const jsonMatch = cleanText.match(/\[.*\]/s)
                if (jsonMatch) {
                    try { allActions = JSON.parse(jsonMatch[0]) } catch (e) { console.error("JSON Parse Error", e) }
                }

                const boardActions = allActions.filter(a => a.action !== 'ask_question')
                const questionAction = allActions.find(a => a.action === 'ask_question')

                if (boardActions.length > 0) {
                    onAction(boardActions)
                    await sendMessage("I've updated the board!", 'model', { isAI: true })
                }

                if (questionAction) {
                    await sendMessage(questionAction.question, 'model', {
                        isAI: true,
                        isQuestion: true,
                        options: questionAction.options || [],
                        allowGenerate: questionAction.allow_generate
                    })
                } else if (boardActions.length === 0) {
                    // Fallback for conversational response (if JSON failed or just chat)
                    // If we found NO JSON but there is text, use the text.
                    if (!jsonMatch && cleanText.length > 0) {
                        await sendMessage(cleanText, 'model', { isAI: true })
                    } else if (!jsonMatch) {
                        await sendMessage("I'm not sure what to do. Could you clarify?", 'model', { isAI: true })
                    }
                }

            } catch (error) {
                console.error("AI Error", error)
                await sendMessage("Something went wrong with AI processing.", 'system')
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
                            {messages.map((m, i) => (
                                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                    {m.role !== 'user' && <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4, marginLeft: 10 }}>{m.sender}</div>}

                                    {/* Question Card UI */}
                                    {m.isQuestion ? (
                                        <div style={{ background: '#f0f5ff', padding: 15, borderRadius: 16, borderTopLeftRadius: 4, border: '1px solid #d6e4ff' }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: 10, color: '#1d39c4' }}>{m.content}</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {m.options?.map(opt => (
                                                    <button key={opt} onClick={() => handleSend(opt)} style={{ background: 'white', border: '1px solid #adc6ff', padding: '6px 12px', borderRadius: 15, cursor: 'pointer', fontSize: '0.9rem', color: '#1d39c4', transition: 'all 0.2s' }} onMouseEnter={e => e.target.style.background = '#f0f5ff'} onMouseLeave={e => e.target.style.background = 'white'}>
                                                        {opt}
                                                    </button>
                                                ))}
                                                {m.allowGenerate && (
                                                    <button onClick={() => handleSend("Surprise me! Make a best guess.")} style={{ background: 'linear-gradient(45deg, #722ed1, #eb2f96)', border: 'none', padding: '6px 14px', borderRadius: 15, cursor: 'pointer', fontSize: '0.9rem', color: 'white', fontWeight: 'bold' }}>
                                                        ✨ Just Generate
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{
                                            padding: '10px 16px', borderRadius: 16,
                                            background: m.role === 'user' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
                                            color: m.role === 'user' ? 'white' : '#333',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                            borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                                            borderTopLeftRadius: m.role === 'user' ? 16 : 4
                                        }}>
                                            {m.content}
                                        </div>
                                    )}
                                </div>
                            ))}
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
