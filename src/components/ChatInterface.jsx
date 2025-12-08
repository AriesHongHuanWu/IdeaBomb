const SYSTEM_PROMPT = `
You are an Advanced AI Workflow Generator for a collaborative whiteboard.
Your goal is to Automate Productivity by creating **Smart, Connected, and Concise Workflows**.

**Capabilities:**
1. **Intelligent Workflows**: Create a hierarchical flow (Root -> Steps -> Details).
   - Use "create_edge" to link nodes logically.
   - **Conciseness**: Content must be short and actionable. No long paragraphs.
2. **Real Content**:
   - **Calendar**: Use explicit dates relative to TODAY (e.g. "YYYY-MM-DD").
   - **YouTube**: If user asks for specifics, find a relevant "Search:" query.

**Date Context**:
- Current Date: {{TODAY}}

**JSON Commands:**
- { "id": "t1", "action": "create_node", "nodeType": "...", "content": "..." }
- { "action": "create_edge", "from": "t1", "to": "t2" }

**Example: "Plan Project"**
\`\`\`json
[
  { "id": "root", "action": "create_node", "nodeType": "Note", "content": "Project Goal" },
  { "id": "cal", "action": "create_node", "nodeType": "Calendar", "content": "Timeline", "data": { "events": { "${new Date().toISOString().slice(0, 8)}20": "Deadline" } } },
  { "id": "task", "action": "create_node", "nodeType": "Todo", "content": "Tasks\\n- [ ] Design\\n- [ ] Code" },
  { "action": "create_edge", "from": "root", "to": "cal" },
  { "action": "create_edge", "from": "root", "to": "task" }
]
\`\`\`
`

import React, { useState, useEffect, useRef } from 'react'
import { BsStars, BsMic, BsMicFill, BsSend } from 'react-icons/bs'
import { GoogleGenerativeAI } from "@google/generative-ai"

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
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

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
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I had trouble processing that. (Check API Key)" }])
        }
        setIsLoading(false)
    }

    return (
        <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 200 }}>
            {isOpen && (
                <div className="glass-panel" style={{ width: 350, height: 500, marginBottom: 20, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.5)' }}>
                    <div style={{ padding: '15px 20px', background: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BsStars /> <span>Gemini AI</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>

                    <div style={{ flex: 1, padding: 15, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ padding: '10px 15px', borderRadius: 15, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? '#4facfe' : 'rgba(255,255,255,0.8)', color: m.role === 'user' ? 'white' : '#333', maxWidth: '85%', fontSize: '0.9rem', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                {m.content}
                            </div>
                        ))}
                        {isLoading && <div style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic', paddingLeft: 10 }}>Thinking...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: 15, borderTop: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <button
                                onClick={startListening}
                                style={{
                                    width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                                    background: isListening ? '#ff4b4b' : '#f0f2f5', color: isListening ? 'white' : '#555',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                    animation: isListening ? 'pulse 1.5s infinite' : 'none'
                                }}
                                title="Voice Input"
                            >
                                {isListening ? <BsMicFill /> : <BsMic />}
                            </button>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder="Type or speak..."
                                style={{ flex: 1, padding: '10px 15px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.1)', outline: 'none', background: 'white' }}
                            />
                            <button onClick={handleSend} style={{ background: '#4facfe', color: 'white', border: 'none', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BsSend size={14} />
                            </button>
                        </div>
                    </div>
                    <style>{`@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255, 75, 75, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(255, 75, 75, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 75, 75, 0); } }`}</style>
                </div>
            )}
            <button onClick={() => setIsOpen(!isOpen)} style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: 'white', border: 'none', boxShadow: '0 10px 30px rgba(0, 242, 254, 0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                {isOpen ? '＋' : <BsStars />}
            </button>
        </div>
    )
}
