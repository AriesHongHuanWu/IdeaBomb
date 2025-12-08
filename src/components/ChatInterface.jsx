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
// ... (Component code remains similar, mostly Prompt update)
import React, { useState } from 'react'
import { BsStars } from 'react-icons/bs'
import { GoogleGenerativeAI } from "@google/generative-ai"

export default function ChatInterface({ onAction, nodes, collaborators }) {
    const [messages, setMessages] = useState([{ role: 'system', content: 'Hello! I am your AI assistant. Ask me to "Plan an event" or "Organize this board".' }])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    const handleSend = async () => {
        if (!input.trim()) return
        const userMsg = input; setInput(''); setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setIsLoading(true)

        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }) // Upgraded model

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
                const actions = JSON.parse(jsonMatch[0])
                onAction(actions)
                setMessages(prev => [...prev, { role: 'ai', content: "Creating your workflow..." }])
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: response }])
            }
        } catch (error) {
            console.error(error)
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I had trouble processing that." }])
        }
        setIsLoading(false)
    }

    return (
        <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 200 }}>
            {isOpen && (
                <div className="glass-panel" style={{ width: 350, height: 500, marginBottom: 20, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                    <div style={{ padding: '15px 20px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                        <span>✨ AI Assistant</span>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ flex: 1, padding: 15, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ padding: '10px 15px', borderRadius: 15, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? '#667eea' : '#f0f2f5', color: m.role === 'user' ? 'white' : '#333', maxWidth: '85%', fontSize: '0.9rem' }}>
                                {m.content}
                            </div>
                        ))}
                        {isLoading && <div style={{ color: '#999', fontSize: '0.8rem', fontStyle: 'italic', paddingLeft: 10 }}>Thinking...</div>}
                    </div>
                    <div style={{ padding: 15, borderTop: '1px solid #eee' }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask AI to plan something..." style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid #ddd', outline: 'none' }} />
                            <button onClick={handleSend} style={{ background: '#667eea', color: 'white', border: 'none', width: 40, height: 40, borderRadius: 10, cursor: 'pointer' }}>➤</button>
                        </div>
                    </div>
                </div>
            )}
            <button onClick={() => setIsOpen(!isOpen)} style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: 'white', border: 'none', boxShadow: '0 10px 30px rgba(0, 242, 254, 0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                {isOpen ? '＋' : <BsStars />}
            </button>
        </div>
    )
}
