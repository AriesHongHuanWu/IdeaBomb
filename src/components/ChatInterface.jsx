import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BsStars, BsMic, BsMicFill, BsSend } from 'react-icons/bs'
import { FiX } from 'react-icons/fi'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { db } from '../firebase'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, setDoc, updateDoc, doc, limit } from 'firebase/firestore'
import { useSettings } from '../App'

const SYSTEM_PROMPT = `You are an expert Project Manager & Board Architect AI for IdeaBomb.
Today is {{TODAY}}. Your goal is to be an **EXPANSIVE, PROACTIVE CONSULTANT**.
When a user gives a short request, **DO NOT** give a short answer. **HALLUCINATE** the missing details based on best practices.
Create COMPREHENSIVE, ACTIONABLE, and VISUALLY ORGANIZED plans with multiple phases, detailed notes, and specific resources.

**⚠️ CRITICAL RULE: FLOWCHART MODE ⚠️**
If the user asks for a "Plan", "Strategy", "Roadmap", or "Process":
1.  **DO NOT** generate just one node.
2.  **MUST GENERATE A FLOWCHART** of at least **5-10 CONNECTED NODES**.
3.  **STRUCTURE**:
    -   **Start**: A "Strategy Node" (NoteType) summarizing the goal.
    -   **Middle**: Series of "Action Nodes" (TodoType) for each phase.
    -   **Resources**: "Link Nodes" or "YouTube Nodes" attached to relevant steps.
4.  **CONNECTIVITY**: All nodes MUST be connected via 'create_edge'.

**STRICT RULES FOR CONTENT:**
1.  **Detailed Notes**: Use Markdown headers, bullet points, and bold text. NO short one-liners.
2.  **Calendar**: If implied (e.g., "12/10 plan"), create a **Calendar Node**.
    -   events MUST be 'YYYY-MM-DD HH:mm'.
    -   Add at least 5 events for the day.
3.  **Google Search**: You HAVE access to Google Search.
    -   If the user asks for "resources", **YOU MUST SEARCH** and provide **REAL URLs**.
    -   Create "Link" nodes or "YouTube" nodes with these URLs.
    -   **DO NOT** leave resources empty.

**LAYOUT ALGORITHM:**
1.  **Start**: (x: 100, y: 100).
2.  **Flow**: Move RIGHT for next steps (x + 350).
3.  **Branches**: Move DOWN for parallel tracks (y + 300).
4.  **No Overlap**: Keep ample spacing.

**NODE TYPES & CONTENT RULES:**
- "Todo": A checklist. content MUST be markdown bullets "- item". Use "label" field for category tag (e.g. "To Do", "In Progress").
- "Calendar": An agenda. content MUST be line-separated "YYYY-MM-DD: Event" or "**HH:MM**: Event".
- "Image/YouTube": content is URL.
- "Link": content is URL.
- "Resource List": Use "Note" type. List multiple URLs as markdown bullets. ([Title](URL)).

3. SPECIAL MODES:
   - "Plan": If user asks for a "Plan", "Strategy", or "Roadmap":
     - Create 5-10 connected "Note" nodes.
     - Layout: Left -> Right flow.
     - Connect them with edges.
   
   - "Kanban" / "Categorized Tasks": If user has MANY tasks or asks for categories:
     - Create MULTIPLE "Todo" nodes.
     - Layout: COLUMN layout (x=0 for "To Do", x=400 for "In Progress", x=800 for "Done").
     - Set the "label" field for each node (e.g. "Front-End", "Back-End" OR "Q1", "Q2").
     - Distribution: Split items logically across these nodes. DO NOT put 20 items in one node.

4. LAYOUT RULES:
    - Canvas center is roughly x=0, y=0.
    - Avoid overlapping existing nodes (check board context).
    - Spacing: At least 350px width per node.

RESPONSE FORMAT:
JSON Array of objects:
[
  { "action": "create_node", "id": "n1", "type": "Todo", "content": "- Task 1\\n- Task 2", "x": 0, "y": 0, "label": "To Do" },
  { "action": "create_node", "id": "n2", "type": "Todo", "content": "- Task 3", "x": 400, "y": 0, "label": "Doing", "color": "#e6f7ff" },
  { "action": "create_edge", "from": "n1", "to": "n2", "label": "Next Step" },
  { "action": "update_node", "id": "existing_id", "type": "Note", "content": "Updated content", "x": 100, "y": 100 }
]
(Only use valid JSON. Do not wrap in markdown code blocks if possible, but I will parse it if you do.)
`

export default function ChatInterface({ boardId, user, onAction, nodes, collaborators, selectedNodeIds = [] }) {
    const { theme, t } = useSettings()
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const messagesEndRef = useRef(null)

    // Sync Messages
    // Sync Messages
    useEffect(() => {
        if (!boardId) return
        // OPTIMIZATION: Limit to last 50 messages to save bandwidth
        const q = query(
            collection(db, 'boards', boardId, 'messages'),
            orderBy('createdAt', 'desc'),
            limit(50)
        )
        const unsub = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(d => d.data())
            if (msgs.length === 0) {
                setMessages([{ role: 'system', content: 'Welcome to Team Chat! Mention @ai to get help.' }])
            } else {
                // Reverse because we queried 'desc' to get the NEWEST 50, 
                // but we want to display them 'asc' (oldest at top).
                setMessages(msgs.reverse())
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

        // Legacy rate limiter removed


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
            setIsLoading(true)
            try {
                // --- Admin Quota Check ---
                const settingsRef = doc(db, 'settings', 'ai_config')
                const settingsSnap = await getDoc(settingsRef)
                const settings = settingsSnap.exists() ? settingsSnap.data() : { globalEnabled: true, userQuotas: {} }

                if (settings.globalEnabled === false) {
                    throw new Error("AI features are currently disabled by the administrator.")
                }

                // Determine User Limit
                const userQuota = settings.userQuotas?.[user.email]
                const dailyLimit = userQuota?.limit || settings.defaultDailyLimit || 10 // Dynamic Default

                // Check Usage
                const today = new Date().toISOString().split('T')[0]
                const usageRef = doc(db, 'users', user.uid, 'ai_usage', today)
                const usageSnap = await getDoc(usageRef)
                const currentUsage = usageSnap.exists() ? usageSnap.data().count : 0

                // Check Usage (Skip if quota system is disabled)
                if (settings.quotaEnabled !== false) {
                    if (currentUsage >= dailyLimit) {
                        throw new Error(`Daily AI quota exceeded (${currentUsage}/${dailyLimit}). Please upgrade your plan or contact admin.`)
                    }
                }

                // Increment Usage (Optimistic - we do it before/during to prevent spam)
                if (usageSnap.exists()) {
                    await updateDoc(usageRef, { count: currentUsage + 1 })
                } else {
                    await setDoc(usageRef, { count: 1, date: today })
                }
                // -------------------------

                const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
                const model = genAI.getGenerativeModel({
                    model: "models/gemini-2.5-flash-lite",
                    tools: [{ googleSearch: {} }]
                })

                // Context Construction
                const historyContext = messages.slice(-10).map(m => `${m.sender || m.role}: ${m.content}`).join('\n')
                const boardContext = nodes.map(n => `- ${n.type} (ID: ${n.id}): ${n.content.substring(0, 100)}...`).join('\n').slice(0, 3000)

                // Inject Selection Context
                let selectionContext = "No nodes selected."
                if (selectedNodeIds && selectedNodeIds.length > 0) {
                    const selectedContent = nodes.filter(n => selectedNodeIds.includes(n.id)).map(n => `ID: ${n.id} Content: ${n.content}`).join('\n')
                    selectionContext = `Currently Selected Nodes:\n${selectedContent}`
                }

                const prompt = SYSTEM_PROMPT.replace('{{TODAY}}', new Date().toDateString()) +
                    `\n\nCONTEXT:\nCollaborators: ${collaborators.map(c => c.displayName).join(', ')}\nChat History:\n${historyContext}\nBoard Content Summary:\n${boardContext}\n${selectionContext}\n\nUser Request: ${userMsg} (Respond as IdeaBomb AI)`

                const result = await model.generateContent(prompt)
                const response = result.response.text()

                // Extract JSON
                let cleanText = response.replace(/```json/g, '').replace(/```javascript/g, '').replace(/```/g, '').trim()

                // Try to find a JSON Array first
                let jsonMatch = cleanText.match(/\[[\s\S]*\]/)

                // If no array, try to find a JSON Object
                if (!jsonMatch) {
                    jsonMatch = cleanText.match(/\{[\s\S]*\}/)
                }

                if (jsonMatch) {
                    try {
                        let parsed = JSON.parse(jsonMatch[0])
                        // If it's a single object, wrap it in an array
                        if (!Array.isArray(parsed)) {
                            parsed = [parsed]
                        }

                        onAction(parsed)

                        // Add AI Response
                        await addDoc(collection(db, 'boards', boardId, 'messages'), {
                            role: 'model',
                            content: "I've executed the plan based on the chat.",
                            createdAt: serverTimestamp(),
                            sender: 'IdeaBomb AI',
                            isAI: true
                        })
                    } catch (e) {
                        console.error("JSON Parse Error:", e)
                        await addDoc(collection(db, 'boards', boardId, 'messages'), {
                            role: 'model', content: "I tried to generate a plan but I made a mistake in the format. Please try again.", createdAt: serverTimestamp(), sender: 'IdeaBomb AI', isAI: true
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
                            position: 'fixed', bottom: 100, right: 30, width: 380, height: 600,
                            background: theme?.cardBg || 'white', borderRadius: 24,
                            boxShadow: '0 20px 50px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
                            zIndex: 2000, overflow: 'hidden', border: `1px solid ${theme?.border || 'rgba(0,0,0,0.1)'}`, color: theme?.text
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '15px 20px', borderBottom: `1px solid ${theme?.border || '#eee'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme?.cardBg || 'rgba(255,255,255,0.5)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#52c41a', boxShadow: '0 0 10px #52c41a' }}></div>
                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>AI Consultant</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme?.text || '#999' }}>
                                <FiX size={16} />
                            </button>
                        </div>

                        <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ background: theme?.bg || 'rgba(0,0,0,0.05)', padding: '10px 15px', borderRadius: '15px 15px 15px 0', alignSelf: 'flex-start', maxWidth: '85%', fontSize: '0.9rem', lineHeight: 1.5, color: theme?.text || '#444' }}>
                                I am your Whiteboard Assistant. Try saying "Create a marketing plan"!
                            </div>
                            {messages.map((msg, i) => {
                                const isMe = msg.uid === user?.uid
                                const isAI = msg.role === 'model' || msg.isAI
                                const align = isMe ? 'flex-end' : 'flex-start'
                                return (
                                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ alignSelf: align, maxWidth: '85%', display: 'flex', flexDirection: 'column', alignItems: align }}>
                                        {!isMe && !isAI && <span style={{ fontSize: '0.7rem', color: theme?.text || '#666', marginBottom: 2, marginLeft: 4 }}>{msg.sender || 'User'}</span>}
                                        <div style={{
                                            background: isMe ? 'linear-gradient(135deg, #4facfe, #00f2fe)' : (isAI ? (theme?.bg || 'white') : (theme?.bg || '#f1f3f4')),
                                            color: isMe ? 'white' : (theme?.text || '#333'),
                                            padding: '10px 15px',
                                            borderRadius: isMe ? '15px 15px 0 15px' : '15px 15px 15px 0',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                            fontSize: '0.95rem',
                                            border: isAI ? `1px solid ${theme?.border || '#eee'}` : 'none'
                                        }}>
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                )
                            })}
                            {isLoading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ alignSelf: 'flex-start', background: '#f0f0f0', padding: '8px 12px', borderRadius: 12, fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>Thinking...</motion.div>}
                            <div ref={messagesEndRef} />
                        </div>

                        <div style={{ padding: 15, background: theme?.cardBg || 'rgba(255,255,255,0.5)', borderTop: `1px solid ${theme?.border || 'rgba(0,0,0,0.05)'}`, display: 'flex', gap: 10 }}>
                            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder={isListening ? "Listening..." : "Ask AI to create..."}
                                    style={{ width: '100%', padding: '12px 40px 12px 15px', borderRadius: 24, border: `1px solid ${theme?.border || '#ddd'}`, outline: 'none', background: theme?.bg || 'white', color: theme?.text || '#333', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.02)', fontSize: '0.95rem' }}
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
