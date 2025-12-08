import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMic, FiSend, FiMessageCircle, FiX, FiCpu } from 'react-icons/fi'
import { GoogleGenerativeAI } from '@google/generative-ai'
import ReactMarkdown from 'react-markdown'

const API_KEY_STORAGE = 'gemini_api_key'

// Context Injection Helper
const getContextString = (nodes, collaborators) => {
  const nodeSummary = nodes.map(n => `- Type: ${n.type}, Content: ${n.content || '(Image/Video)'}`).join('\n')
  const userSummary = collaborators.map(c => c.displayName).join(', ')
  return `
Current Date: ${new Date().toISOString().split('T')[0]}
Active Users: ${userSummary}
Current Board Items:
${nodeSummary.slice(0, 2000)} ${nodeSummary.length > 2000 ? '...(truncated)' : ''}
`
}

const SYSTEM_PROMPT = `
You are an Advanced AI Workflow Generator for a collaborative whiteboard.
Your goal is to Automate Productivity by creating comprehensive workflows.

**Capabilities:**
1. Single Actions: Create a specific note or task.
2. **Workflows (Priority)**: When user asks for a plan (e.g. "Event Planning", "Research Topic"), you MUST generate a BATCH of nodes:
   - A **Calendar** node for the timeline.
   - A **Todo** node for tasks.
   - **YouTube/Search** nodes for resources.
   - **Note** nodes for strategy/details.

**Commands (JSON output only):**
You can output a JSON ARRAY of actions.
- { "action": "create_node", "nodeType": "Todo"|"Note"|"Calendar"|"YouTube", "content": "..." }
- { "action": "create_calendar_plan", "events": { "1": "Start" } }

**Rules:**
- Read the "Current Board Context" to avoid duplicates and connect to existing ideas.
- If user asks for "Research [Topic]", create a YouTube node with content "Search: [Topic]".
- Be proactive. If user asks "Plan a party", don't just say "OK", create the plan immediately.

Example JSON for "Plan a Launch":
\`\`\`json
[
  { "action": "create_node", "nodeType": "Calendar", "content": "Launch Timeline", "data": { "events": { "1": "Kickoff", "14": "Release" } } },
  { "action": "create_node", "nodeType": "Todo", "content": "Launch Tasks\\n- [ ] QA\\n- [ ] Marketing" },
  { "action": "create_node", "nodeType": "YouTube", "content": "Search: Product Launch Tips" }
]
\`\`\`
`

export default function ChatInterface({ onAction, nodes = [], collaborators = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [apiKey, setApiKey] = useState(localStorage.getItem(API_KEY_STORAGE) || import.meta.env.VITE_GEMINI_API_KEY || '')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([{ role: 'model', text: 'Hi! I am your Workflow Engine. Try "Plan a 12/10 songwar event" and I will set up the board.' }])
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isOpen])

  const handleSend = async () => {
    if (!input.trim()) return
    if (!apiKey) { setMessages(p => [...p, { role: 'model', text: 'Please enter your Gemini API Key first.' }]); return }
    const userText = input; setInput(''); setMessages(p => [...p, { role: 'user', text: userText }]); setIsLoading(true)

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }, { apiVersion: 'v1beta' })

      // Inject Context
      const context = getContextString(nodes, collaborators)
      const prompt = `${SYSTEM_PROMPT}\n\n${context}\n\nUser: ${userText}`

      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const jsonMatch = text.match(/```json\s*([\[\{][\s\S]*?[\]\}])\s*```/) || text.match(/([\[\{][\s\S]*?"action"[\s\S]*?[\]\}])/)

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1])
          if (Array.isArray(parsed)) { onAction(parsed); setMessages(p => [...p, { role: 'model', text: `✨ Generated ${parsed.length} workflow items.` }]) }
          else { onAction([parsed]); setMessages(p => [...p, { role: 'model', text: "Feature added." }]) }
        } catch (e) { setMessages(p => [...p, { role: 'model', text: text }]) }
      } else { setMessages(p => [...p, { role: 'model', text }]) }
    } catch (e) { setMessages(p => [...p, { role: 'model', text: `Error: ${e.message}` }]) }
    finally { setIsLoading(false) }
  }

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return alert('Browser not supported')
    if (isListening) { setIsListening(false) }
    else { const r = new SpeechRecognition(); r.lang = 'en-US'; r.onresult = e => setInput(e.results[0][0].transcript); r.onend = () => setIsListening(false); r.start(); setIsListening(true) }
  }
  const saveKey = (key) => { setApiKey(key); localStorage.setItem(API_KEY_STORAGE, key) }
  return (
    <>
      <PrivacyInput apiKey={apiKey} setApiKey={saveKey} isOpen={isOpen} />
      <div style={{ position: 'absolute', bottom: 30, right: 30, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass-panel" style={{ width: 350, height: 500, marginBottom: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.95)' }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}><FiCpu style={{ color: 'var(--primary)' }} /> Workflow Engine</div><button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FiX /></button></div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 15 }}>
                {messages.map((m, i) => (<div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? 'var(--primary)' : '#f0f2f5', color: m.role === 'user' ? 'white' : '#333', padding: '10px 15px', borderRadius: '12px', maxWidth: '85%', fontSize: '0.9rem' }}><ReactMarkdown>{m.text}</ReactMarkdown></div>))}
                {isLoading && <div style={{ fontSize: '0.8rem', color: '#999', paddingLeft: 10 }}>Analysis & Generation in progress...</div>}
                <div ref={bottomRef} />
              </div>
              <div style={{ padding: 15, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 10 }}>
                <button onClick={toggleListening} style={{ background: isListening ? '#ea4335' : 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isListening ? 'white' : '#555' }}><FiMic /></button>
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask for a plan..." style={{ flex: 1, border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: 20, padding: '0 15px', outline: 'none' }} />
                <button onClick={handleSend} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FiSend /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsOpen(!isOpen)} className="glass-panel" style={{ width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', background: 'var(--primary)', color: 'white', fontSize: '1.5rem', boxShadow: '0 4px 15px rgba(26, 115, 232, 0.4)' }}>{isOpen ? <FiX /> : <FiMessageCircle />}</motion.button>
      </div>
    </>
  )
}
function PrivacyInput({ apiKey, setApiKey, isOpen }) { if (apiKey || !isOpen) return null; return <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 300 }}><input type="password" placeholder="Gemini API Key" onChange={(e) => setApiKey(e.target.value)} className="glass-panel" style={{ padding: '5px 10px', width: 150, fontSize: '0.8rem' }} /></div> }
