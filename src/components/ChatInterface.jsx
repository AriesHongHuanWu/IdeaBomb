import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMic, FiSend, FiMessageCircle, FiX, FiCpu } from 'react-icons/fi'
import { GoogleGenerativeAI } from '@google/generative-ai'
import ReactMarkdown from 'react-markdown'

const API_KEY_STORAGE = 'gemini_api_key'

// System prompt to guide Gemini to output JSON for actions
const SYSTEM_PROMPT = `
You are an AI assistant for a collaborative whiteboard.
You can control the board by outputting JSON actions.
If the user asks to create or add a task, note, or calendar event, output a JSON block like this:
\`\`\`json
{ "action": "create_node", "nodeType": "Todo", "content": "- [ ] Your task here" }
\`\`\`
Valid nodeTypes: "Todo", "Note", "Calendar", "Marketing".
If no action is needed, just reply with text.
Short and concise.
`

export default function ChatInterface({ onAction }) {
  const [isOpen, setIsOpen] = useState(false)
  const [apiKey, setApiKey] = useState(localStorage.getItem(API_KEY_STORAGE) || import.meta.env.VITE_GEMINI_API_KEY || '')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hi! I can help you manage your board. Try "Create a todo list for launch".' }
  ])
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const bottomRef = useRef(null)

  // Audio notification reference (optional)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const handleSend = async () => {
    if (!input.trim()) return
    if (!apiKey) {
      setMessages(p => [...p, { role: 'model', text: 'Please enter your Google Gemini API Key first.' }])
      return
    }

    const userText = input
    setInput('')
    setMessages(p => [...p, { role: 'user', text: userText }])
    setIsLoading(true)

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      // Updated to requested model
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }, { apiVersion: 'v1beta' })

      // Construct prompt with context
      const prompt = `${SYSTEM_PROMPT}\n\nUser: ${userText}`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parse for JSON actions
      const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/) || text.match(/(\{[\s\S]*?"action":[\s\S]*?\})/)

      if (jsonMatch) {
        try {
          const action = JSON.parse(jsonMatch[1])
          if (action.action && onAction) {
            onAction(action)
            setMessages(p => [...p, { role: 'model', text: "I've added that to your whiteboard." }])
          }
        } catch (e) {
          console.error("Failed to parse AI action", e)
          setMessages(p => [...p, { role: 'model', text: text }])
        }
      } else {
        setMessages(p => [...p, { role: 'model', text }])
      }

    } catch (error) {
      setMessages(p => [...p, { role: 'model', text: `Error: ${error.message}` }])
    } finally {
      setIsLoading(false)
    }
  }

  // Voice Logic
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return alert('Browser not supported')

    if (isListening) {
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.onresult = (e) => setInput(e.results[0][0].transcript)
    recognition.onend = () => setIsListening(false)
    recognition.start()
    setIsListening(true)
  }

  const saveKey = (key) => {
    setApiKey(key)
    localStorage.setItem(API_KEY_STORAGE, key)
  }

  return (
    <>
      <PrivacyInput apiKey={apiKey} setApiKey={saveKey} isOpen={isOpen} />

      <div style={{ position: 'absolute', bottom: 30, right: 30, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel"
              style={{
                width: 350, height: 500, marginBottom: 20, display: 'flex', flexDirection: 'column',
                overflow: 'hidden', background: 'rgba(255, 255, 255, 0.85)'
              }}
            >
              <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
                  <FiCpu style={{ color: 'var(--primary)' }} /> Gemini Assistant
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FiX /></button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 15 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    background: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                    color: m.role === 'user' ? 'white' : 'var(--text-main)',
                    padding: '10px 15px', borderRadius: '12px', maxWidth: '85%', fontSize: '0.9rem',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}>
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                ))}
                {isLoading && <div style={{ fontSize: '0.8rem', color: '#999', paddingLeft: 10 }}>Processing...</div>}
                <div ref={bottomRef} />
              </div>

              <div style={{ padding: 15, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 10 }}>
                <button onClick={toggleListening} style={{
                  background: isListening ? '#ea4335' : 'rgba(0,0,0,0.05)', border: 'none',
                  borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isListening ? 'white' : '#555'
                }}><FiMic /></button>
                <input
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type or speak..."
                  style={{ flex: 1, border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: 20, padding: '0 15px', outline: 'none' }}
                />
                <button onClick={handleSend} style={{
                  background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%',
                  width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}><FiSend /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="glass-panel"
          style={{
            width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: 'none', background: 'var(--primary)', color: 'white', fontSize: '1.5rem',
            boxShadow: '0 4px 15px rgba(26, 115, 232, 0.4)'
          }}
        >
          {isOpen ? <FiX /> : <FiMessageCircle />}
        </motion.button>
      </div>
    </>
  )
}

function PrivacyInput({ apiKey, setApiKey, isOpen }) {
  if (apiKey || !isOpen) return null
  return (
    <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 300 }}>
      <input type="password" placeholder="JSON API Key" onChange={(e) => setApiKey(e.target.value)} className="glass-panel" style={{ padding: '5px 10px', width: 150, fontSize: '0.8rem' }} />
    </div>
  )
}
