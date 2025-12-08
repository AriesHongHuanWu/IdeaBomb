import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BsStars, BsMic, BsMicFill, BsSend } from 'react-icons/bs'
import { FiX } from 'react-icons/fi'
import { GoogleGenerativeAI } from "@google/generative-ai"

const SYSTEM_PROMPT = `You are a whiteboard AI assistant for IdeaBomb. Today is {{TODAY}}.
Your job is to help users organize ideas, create plans, and build workflows on their whiteboard.

CAPABILITIES:
- Create nodes: Notes, Todos, Calendars, Images, YouTube videos, and Links.
- Delete nodes: Remove nodes by ID or by content match.
- Create edges: Connect nodes together.
- Arrange board: Trigger auto-layout.

RESPONSE FORMAT: Always respond with a JSON array of actions. Example:
[
  {"action": "create_node", "id": "n1", "nodeType": "Note", "content": "Project Idea"},
  {"action": "create_node", "id": "n2", "nodeType": "Todo", "content": "Task List", "data": {"items": [{"text": "Research", "done": false}]}},
  {"action": "create_video", "id": "n3", "url": "https://youtube.com/watch?v=example"},
  {"action": "create_link", "id": "n4", "url": "https://example.com"},
  {"action": "create_edge", "from": "n1", "to": "n2"},
  {"action": "delete_node", "content": "old note"}
]

For calendar/planning, use create_calendar_plan with events object: {"YYYY-MM-DD": "Event Name"}.
If the user just wants to chat, respond with a friendly message (no JSON needed).`

export default function ChatInterface({ onAction, nodes, collaborators }) {
    const [messages, setMessages] = useState([{ role: 'system', content: 'Hello! I am your AI assistant. Ask me to "Plan an event" or "Organize this board".' }])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const messagesEndRef = useRef(null)

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

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
        if (!input.trim()) return
        const userMsg = input
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setIsLoading(true)

        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
            const model = genAI.getGenerativeModel({ model: "models/gemini-flash-lite-latest" })

            // Context
            const boardContext = nodes.map(n => `- ${n.type}: ${n.content} (at ${Math.round(n.x)},${Math.round(n.y)})`).join('\n').slice(0, 2000)
            const prompt = `${SYSTEM_PROMPT.replace('{{TODAY}}', new Date().toISOString().split('T')[0])}
            
            Current Board Context:
            ${boardContext}
            
            User Request: ${userMsg}`

            const result = await model.generateContent(prompt)
            const response = result.response.text()

            // Extract JSON
            const jsonMatch = response.match(/\[.*\]/s)
            if (jsonMatch) {
                try {
                    const actions = JSON.parse(jsonMatch[0])
                    onAction(actions)
                    setMessages(prev => [...prev, { role: 'ai', content: "Creating your workflow..." }])
                } catch (e) {
                    setMessages(prev => [...prev, { role: 'ai', content: response }])
                }
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: response }])
            }
        } catch (error) {
            console.error(error)
            let msg = `Sorry, error: ${error.message}`
            if (error.message.includes('API key')) msg += " (Please check VITE_GEMINI_API_KEY in Netlify)"
            setMessages(prev => [...prev, { role: 'ai', content: msg }])
        }
        setIsLoading(false)
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
                                <BsStars size={20} /> <span style={{ fontSize: '1.1rem' }}>Gemini AI</span>
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
                            {messages.map((msg, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', background: msg.role === 'user' ? 'linear-gradient(135deg, #4facfe, #00f2fe)' : 'white', color: msg.role === 'user' ? 'white' : '#333', padding: '10px 15px', borderRadius: msg.role === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0', maxWidth: '85%', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: '0.95rem', border: msg.role === 'model' ? '1px solid #eee' : 'none' }}>
                                    {msg.content}
                                </motion.div>
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
