import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BsStars, BsMic, BsMicFill, BsSend } from 'react-icons/bs'
import { FiX } from 'react-icons/fi'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { db } from '../firebase'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, setDoc, updateDoc, doc } from 'firebase/firestore'

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

    // --- Model Selection ---
    const [modelProvider, setModelProvider] = useState('Gemini') // 'Gemini' or 'GitHub'

    const callGitHubModel = async (userPrompt, systemPrompt) => {
        const token = import.meta.env.VITE_GITHUB_TOKEN
        if (!token) throw new Error("Missing GitHub Token")

        try {
            const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
                    model: "gpt-4o", temperature: 0.7, max_tokens: 4000
                })
            })
            if (!response.ok) throw new Error(`GitHub API Error: ${response.status}`)
            const data = await response.json()
            return data.choices[0].message.content
        } catch (e) {
            console.error("GitHub Call Failed:", e)
            throw new Error(`GPT-4o unavailable: ${e.message}`)
        }
    }

    const handleSend = async () => {
        if (!input.trim() || !user || !boardId || isLoading) return
        const userMsg = input
        setInput('')
        setIsLoading(true)

        // 1. User Message
        await addDoc(collection(db, 'boards', boardId, 'messages'), {
            role: 'user', content: userMsg, createdAt: serverTimestamp(),
            sender: user.displayName || 'User', uid: user.uid, photoURL: user.photoURL
        })

        // 2. AI Processing
        if (userMsg.toLowerCase().includes('@ai')) {
            try {
                // --- Build Prompt ---
                const historyContext = messages.slice(-10).map(m => `${m.sender || m.role}: ${m.content}`).join('\n')
                const boardContext = nodes.map(n => `- ${n.type} (ID: ${n.id}): ${n.content ? JSON.stringify(n.content).substring(0, 100) : ''}`).join('\n').slice(0, 3000)
                let selectionContext = ""
                if (selectedNodeIds?.length > 0) {
                    const selectedContent = nodes.filter(n => selectedNodeIds.includes(n.id)).map(n => `ID: ${n.id} Content: ${n.content}`).join('\n')
                    selectionContext = `\nSelected Nodes:\n${selectedContent}`
                }

                const fullPrompt = SYSTEM_PROMPT.replace('{{TODAY}}', new Date().toDateString()) +
                    `\n\nCONTEXT:\nCollaborators: ${collaborators.map(c => c.displayName).join(', ')}\nChat History:\n${historyContext}\nBoard Overview:\n${boardContext}\n${selectionContext}\n\nUser Request: ${userMsg}`

                let aiText = ""

                // --- Call Model ---
                if (modelProvider === 'GitHub') {
                    aiText = await callGitHubModel(userMsg, fullPrompt)
                } else {
                    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
                    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
                    const result = await model.generateContent(fullPrompt)
                    aiText = result.response.text()
                }

                // --- 3. Parsing & Actions ---
                let actions = []
                let displayText = aiText

                // A. Try JSON Extraction
                let jsonMatch = aiText.match(/\[\s*\{.*\}\s*\]/s) || aiText.match(/\{[\s\S]*\}/s)
                if (jsonMatch) {
                    try {
                        let parsed = JSON.parse(jsonMatch[0])
                        actions = Array.isArray(parsed) ? parsed : [parsed]
                        displayText = aiText.replace(jsonMatch[0], '').trim() || "Executed actions."
                    } catch (e) { console.warn("JSON parse failed", e) }
                }

                // B. YouTube Auto-Convert (Fix)
                if (actions.length === 0 && (aiText.includes('youtube.com/watch') || aiText.includes('youtu.be/'))) {
                    const ytMatch = aiText.match(/(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+))/)
                    if (ytMatch && ytMatch[2]) {
                        actions.push({
                            action: 'create_node', type: 'YouTube', videoId: ytMatch[2],
                            x: 0, y: 0, content: `Suggested Video`
                        })
                        displayText += `\n(Auto-converted YouTube link to Widget)`
                    }
                }

                // Execute Actions
                if (actions.length > 0) {
                    if (onAction) onAction(actions)
                }

                // Save Response
                await addDoc(collection(db, 'boards', boardId, 'messages'), {
                    role: 'assistant', content: displayText, createdAt: serverTimestamp(),
                    sender: `IdeaBomb AI (${modelProvider})`, isAI: true
                })

            } catch (error) {
                console.error("AI Error:", error)
                let msg = "Error processing request."
                if (error.message.includes('429')) msg = "Rate limit exceeded. Try again later."
                await addDoc(collection(db, 'boards', boardId, 'messages'), {
                    role: 'assistant', content: `${msg} (${error.message})`, createdAt: serverTimestamp(), sender: 'System'
                })
            }
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
                                <BsStars size={20} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '1rem', lineHeight: '1.2' }}>Team Collaboration</span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 'normal', opacity: 0.9 }}>Type <strong>@ai</strong> for help</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <select
                                    value={modelProvider}
                                    onChange={(e) => setModelProvider(e.target.value)}
                                    style={{
                                        fontSize: '0.75rem', padding: '4px 8px', borderRadius: 8,
                                        border: 'none', outline: 'none', cursor: 'pointer',
                                        background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold'
                                    }}
                                >
                                    <option style={{ color: 'black' }} value="Gemini">Gemini 2.0</option>
                                    <option style={{ color: 'black' }} value="GitHub">OpenAI GPT-5</option>
                                </select>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.3)'}
                                    onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
                                >
                                    <FiX size={16} />
                                </button>
                            </div>
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
