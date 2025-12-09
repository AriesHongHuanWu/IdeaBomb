import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight, FiCheck, FiCpu, FiMessageSquare, FiGrid, FiChevronDown } from 'react-icons/fi'

export default function LandingPage({ user }) {
    const navigate = useNavigate()

    return (
        <div style={{ fontFamily: '"Google Sans", "Inter", sans-serif', width: '100vw', minHeight: '100vh', background: '#ffffff', color: '#202124', overflowX: 'hidden' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', position: 'fixed', top: 0, width: '100%', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', zIndex: 1000, borderBottom: '1px solid #f1f3f4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 'bold', fontSize: '1.4rem', color: '#5f6368', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <div style={{ width: 24, height: 24, background: 'linear-gradient(135deg, #4285f4, #34a853, #fbbc05, #ea4335)', borderRadius: 4 }}></div>
                    IdeaBomb <span style={{ fontWeight: 400, opacity: 0.7 }}>Enterprise</span>
                </div>
                <nav style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
                    <a href="#features" style={{ textDecoration: 'none', color: '#5f6368', fontSize: '0.95rem', fontWeight: 500 }}>Features</a>
                    <a href="#tutorial" style={{ textDecoration: 'none', color: '#5f6368', fontSize: '0.95rem', fontWeight: 500 }}>How It Works</a>
                    <a href="#solutions" style={{ textDecoration: 'none', color: '#5f6368', fontSize: '0.95rem', fontWeight: 500 }}>Solutions</a>
                    <a href="#pricing" style={{ textDecoration: 'none', color: '#5f6368', fontSize: '0.95rem', fontWeight: 500 }}>Pricing</a>
                    {user ? (
                        <button onClick={() => navigate('/dashboard')} style={{ background: '#1a73e8', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 4, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>Go to Dashboard</button>
                    ) : (
                        <button onClick={() => navigate('/login')} style={{ background: '#1a73e8', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 4, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>Sign In</button>
                    )}
                </nav>
            </header>

            {/* Hero Section */}
            <section style={{ paddingTop: 160, paddingBottom: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 1200, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ fontSize: '4rem', lineHeight: 1.1, fontWeight: 700, color: '#202124', marginBottom: 24, maxWidth: 900 }}
                >
                    Collaborate without limits. Create with intelligence.
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}
                    style={{ fontSize: '1.25rem', color: '#5f6368', maxWidth: 700, lineHeight: 1.6, marginBottom: 40 }}
                >
                    IdeaBomb brings your team together in a unified workspace powered by Gemini AI. Whiteboard, chat, and manage projects in real-time.
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }} style={{ display: 'flex', gap: 20 }}>
                    <button onClick={() => navigate(user ? '/dashboard' : '/login')} style={{ background: '#1a73e8', color: 'white', border: 'none', padding: '16px 36px', borderRadius: 4, fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,115,232,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        Get Started <FiArrowRight />
                    </button>
                    <button style={{ background: 'transparent', color: '#1a73e8', border: '1px solid #dadce0', padding: '16px 36px', borderRadius: 4, fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer' }}>Contact Sales</button>
                </motion.div>

                {/* Hero Image Mockup */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 1 }} style={{ marginTop: 80, width: '100%', borderRadius: 16, border: '1px solid #dadce0', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', overflow: 'hidden', maxWidth: 1000 }}>
                    <div style={{ background: '#f1f3f4', padding: '12px 20px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }}></div>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }}></div>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }}></div>
                        <div style={{ background: 'white', borderRadius: 4, flex: 1, margin: '0 20px', height: 28, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: '0.8rem', color: '#888' }}>ideabomb.app/board/marketing-plan</div>
                    </div>
                    {/* High Contrast Mockup Container */}
                    <div style={{ height: 500, background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#e0e0e0 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }}></div>

                        {/* Left Sidebar Mockup */}
                        <div style={{ position: 'absolute', top: 20, bottom: 20, left: 20, width: 60, background: '#fff', borderRadius: 8, border: '1px solid #dadce0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 15, gap: 20, zIndex: 10 }}>
                            <div style={{ width: 32, height: 32, background: '#e8f0fe', borderRadius: 8, border: '1px solid #d2e3fc' }}></div>
                            <div style={{ width: 24, height: 24, background: '#f1f3f4', borderRadius: 4 }}></div>
                            <div style={{ width: 24, height: 24, background: '#f1f3f4', borderRadius: 4 }}></div>
                            <div style={{ width: 24, height: 24, background: '#f1f3f4', borderRadius: 4 }}></div>
                        </div>

                        {/* Node 1 */}
                        <div style={{ position: 'absolute', top: 80, left: 140, width: 200, height: 120, background: '#fff', border: '2px solid #4285f4', borderRadius: 8, padding: 20, boxShadow: '0 4px 15px rgba(66,133,244,0.15)', zIndex: 5 }}>
                            <div style={{ width: '80%', height: 12, background: '#e0e0e0', borderRadius: 4, marginBottom: 15 }}></div>
                            <div style={{ width: '100%', height: 8, background: '#f0f0f0', borderRadius: 4, marginBottom: 8 }}></div>
                            <div style={{ width: '100%', height: 8, background: '#f0f0f0', borderRadius: 4, marginBottom: 8 }}></div>
                        </div>

                        {/* Connecting Arrow */}
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                            <path d="M 340 140 C 400 140, 420 200, 480 200" stroke="#9aa0a6" strokeWidth="3" fill="none" />
                            <polygon points="480,200 470,195 470,205" fill="#9aa0a6" />
                        </svg>

                        {/* Node 2 (AI Summary) */}
                        <div style={{ position: 'absolute', top: 160, left: 480, width: 240, height: 140, background: '#fff', border: '1px solid #dadce0', borderRadius: 8, padding: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', zIndex: 6, overflow: 'hidden' }}>
                            <div style={{ background: '#f8f9fa', padding: '10px 15px', borderBottom: '1px solid #f1f3f4', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 12, height: 12, background: 'linear-gradient(135deg, #4285f4, #ea4335)', borderRadius: '50%' }}></div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5f6368' }}>AI Summary</div>
                            </div>
                            <div style={{ padding: 15 }}>
                                <div style={{ width: '90%', height: 8, background: '#f1f3f4', borderRadius: 4, marginBottom: 10 }}></div>
                                <div style={{ width: '60%', height: 8, background: '#f1f3f4', borderRadius: 4 }}></div>
                            </div>
                        </div>

                        {/* Floating AI Pill */}
                        <div style={{ position: 'absolute', bottom: 40, right: 40, background: '#34a853', color: 'white', padding: '12px 24px', borderRadius: 30, fontSize: '1rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(52,168,83,0.3)', zIndex: 20 }}>
                            ✨ @ai Analyze
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" style={{ padding: '80px 20px', background: '#fff' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#202124', marginBottom: 20 }}>Why choose IdeaBomb?</h2>
                        <p style={{ fontSize: '1.2rem', color: '#5f6368' }}>Enterprise-grade security meets consumer-grade simplicity.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
                        <FeatureCard icon={<FiGrid size={40} color="#1a73e8" />} title="Infinite Canvas" desc="Break free from page limits. Organize thoughts, flowcharts, and plans on an endless whiteboard." />
                        <FeatureCard icon={<FiCpu size={40} color="#ea4335" />} title="Gemini AI Integration" desc="Use @ai to summarize discussions, generate content, and organize your board automatically." />
                        <FeatureCard icon={<FiMessageSquare size={40} color="#34a853" />} title="Real-time Collaboration" desc="Chat, comment, and co-edit with your team instantly. See cursors and updates live." />
                    </div>
                </div>
            </section>

            {/* How It Works (Tutorial) Section */}
            <section id="tutorial" style={{ padding: '80px 20px', background: 'linear-gradient(180deg, #ffffff 0%, #f1f3f4 100%)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#202124', marginBottom: 20 }}>How It Works</h2>
                        <p style={{ fontSize: '1.2rem', color: '#5f6368' }}>Get started in seconds. Master it in minutes.</p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 40, marginTop: 40 }}>
                        <TutorialStep number="1" title="Sign Up & Create" desc="Log in with your Google account and create your first unlimited whiteboard." />
                        <TutorialStep number="2" title="Invite Your Team" desc="Share the link or invite via email to collaborate in real-time." />
                        <TutorialStep number="3" title="Unleash AI" desc="Type @ai in the chat or context menu to brainstorm, summarize, and create content." />
                    </div>
                </div>
            </section>

            {/* Solutions Section */}
            <section id="solutions" style={{ padding: '80px 20px', background: '#f8f9fa' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#202124', marginBottom: 20 }}>Tailored Solutions</h2>
                        <p style={{ fontSize: '1.2rem', color: '#5f6368' }}>Empowering teams across every industry.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 30 }}>
                        <div style={{ background: 'white', padding: 30, borderRadius: 12, border: '1px solid #e0e0e0' }}>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 10 }}>Designers</h4>
                            <p style={{ color: '#5f6368' }}>Wireframe, prototype, and gather feedback in one shared space.</p>
                        </div>
                        <div style={{ background: 'white', padding: 30, borderRadius: 12, border: '1px solid #e0e0e0' }}>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 10 }}>Engineers</h4>
                            <p style={{ color: '#5f6368' }}>Map out architectures, flowcharts, and system designs collaboratively.</p>
                        </div>
                        <div style={{ background: 'white', padding: 30, borderRadius: 12, border: '1px solid #e0e0e0' }}>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 10 }}>Managers</h4>
                            <p style={{ color: '#5f6368' }}>Track projects, organize sprints, and align team goals seamlessly.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" style={{ padding: '80px 20px', background: '#fff' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#202124', marginBottom: 20 }}>Simple, Transparent Pricing</h2>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 30, flexWrap: 'wrap', marginTop: 50 }}>
                        {/* Free Tier */}
                        <div style={{ width: 300, border: '1px solid #dadce0', borderRadius: 12, padding: 30, textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Starter</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, margin: '15px 0' }}>$0 <span style={{ fontSize: '1rem', fontWeight: 400, color: '#5f6368' }}>/ month</span></div>
                            <p style={{ color: '#5f6368', marginBottom: 30 }}>Perfect for getting started with AI collaboration.</p>
                            {/* Corrected Button: Current Plan if logged in, else Get Started */}
                            {user ? (
                                <button disabled style={{ width: '100%', padding: '12px', background: '#e8f0fe', border: 'none', color: '#1967d2', borderRadius: 4, fontWeight: 700, cursor: 'default', marginBottom: 20 }}>Current Plan</button>
                            ) : (
                                <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '12px', background: '#1a73e8', border: 'none', color: 'white', borderRadius: 4, fontWeight: 600, cursor: 'pointer', marginBottom: 20 }}>Get Started</button>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: '#5f6368', fontSize: '0.9rem' }}>
                                <div><FiCheck style={{ color: '#34a853', marginRight: 8 }} /> Unlimited Boards</div>
                                <div><FiCheck style={{ color: '#34a853', marginRight: 8 }} /> Real-time Collaboration</div>
                                <div><FiCheck style={{ color: '#34a853', marginRight: 8 }} /> Access to Basic AI (Flash-Lite)</div>
                            </div>
                        </div>
                        {/* Pro Tier (Coming Soon) */}
                        <div style={{ width: 300, border: '1px solid #ea4335', borderRadius: 12, padding: 30, textAlign: 'left', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: '#fff8f8' }}>
                            <div style={{ position: 'absolute', top: 12, right: -40, background: '#ea4335', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '5px 40px', transform: 'rotate(45deg)' }}>COMING SOON</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Professional</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, margin: '15px 0' }}>$2 <span style={{ fontSize: '1rem', fontWeight: 400, color: '#5f6368' }}>/ month</span></div>
                            <p style={{ color: '#ea4335', fontWeight: 500, marginBottom: 10 }}>Experience the Next Level of AI.</p>
                            <p style={{ color: '#5f6368', fontSize: '0.9rem', marginBottom: 20 }}>Unlock superior reasoning with advanced models.</p>
                            <button disabled style={{ width: '100%', padding: '12px', background: '#ea4335', border: 'none', color: 'white', borderRadius: 4, fontWeight: 600, cursor: 'not-allowed', opacity: 0.7, marginBottom: 20 }}>Join Waitlist</button>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: '#5f6368', fontSize: '0.9rem' }}>
                                <div><FiCpu style={{ color: '#ea4335', marginRight: 8 }} /> <b>Advanced Gemini Pro/Ultra</b></div>
                                <div><FiCheck style={{ color: '#34a853', marginRight: 8 }} /> Faster Response Times</div>
                                <div><FiCheck style={{ color: '#34a853', marginRight: 8 }} /> Deeper Context Window</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" style={{ padding: '80px 20px', background: '#fff' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#202124', marginBottom: 20 }}>Frequently Asked Questions</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <FAQItem question="Is IdeaBomb really free?" answer="Yes! The Starter plan is completely free and includes unlimited boards and real-time collaboration." />
                        <FAQItem question="How does the AI integration work?" answer="Simply type @ai in any text note or chat message. Gemini will analyze your board context and provide intelligent suggestions, summaries, or content." />
                        <FAQItem question="Can I invite my entire team?" answer="Absolutely. There are no limits on the number of collaborators you can invite to a board, even on the free plan." />
                        <FAQItem question="Is my data secure?" answer="We use enterprise-grade encryption and secure Google authenticaton to ensure your ideas stay safe." />
                    </div>
                </div>
            </section>

            {/* Footer with Contact Info */}
            <footer style={{ background: '#f8f9fa', padding: '60px 40px', borderTop: '1px solid #dadce0' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 'bold', fontSize: '1.2rem', color: '#5f6368', marginBottom: 20 }}>
                            <div style={{ width: 20, height: 20, background: '#5f6368', borderRadius: 4 }}></div> IdeaBomb
                        </div>
                        <div style={{ color: '#5f6368', fontSize: '0.9rem' }}>© 2025 IdeaBomb Inc. All rights reserved.</div>
                        <div style={{ color: '#5f6368', fontSize: '0.8rem', marginTop: 10, fontWeight: 500 }}>Created by AWBest Studio</div>
                        <div style={{ marginTop: 15, display: 'flex', gap: 15 }}>
                            <span onClick={() => navigate('/terms')} style={{ color: '#5f6368', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>Terms of Service</span>
                            <span onClick={() => navigate('/privacy')} style={{ color: '#5f6368', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>Privacy Policy</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 60 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <span style={{ fontWeight: 600, color: '#202124' }}>Product</span>
                            <a href="#" style={{ textDecoration: 'none', color: '#5f6368', fontSize: '0.9rem' }}>Overview</a>
                            <a href="#solutions" style={{ textDecoration: 'none', color: '#5f6368', fontSize: '0.9rem' }}>Solutions</a>
                            <a href="#pricing" style={{ textDecoration: 'none', color: '#5f6368', fontSize: '0.9rem' }}>Pricing</a>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <span style={{ fontWeight: 600, color: '#202124' }}>Contact</span>
                            <div style={{ color: '#5f6368', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                Email: <a href="mailto:arieswu001@gmail.com" style={{ color: '#1a73e8', textDecoration: 'none' }}>arieswu001@gmail.com</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div style={{ padding: 30, background: 'white', border: '1px solid #dadce0', borderRadius: 12, transition: 'transform 0.2s', cursor: 'default' }}>
            <div style={{ marginBottom: 20 }}>{icon}</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#202124', marginBottom: 12 }}>{title}</h3>
            <p style={{ fontSize: '1rem', color: '#5f6368', lineHeight: 1.5 }}>{desc}</p>
        </div>
    )
}

function TutorialStep({ number, title, desc }) {
    return (
        <div style={{ width: 300, textAlign: 'left', position: 'relative' }}>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: '#e8eaed', opacity: 0.8, position: 'absolute', top: -30, left: -10, zIndex: 0 }}>{number}</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#202124', marginBottom: 15 }}>{title}</h3>
                <p style={{ fontSize: '1rem', color: '#5f6368', lineHeight: 1.5 }}>{desc}</p>
            </div>
        </div>
    )
}

function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = React.useState(false)
    return (
        <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: 20 }}>
            <button onClick={() => setIsOpen(!isOpen)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', fontSize: '1.2rem', fontWeight: 500, color: '#202124', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {question}
                <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </button>
            {isOpen && <p style={{ marginTop: 15, fontSize: '1rem', color: '#5f6368', lineHeight: 1.6 }}>{answer}</p>}
        </div>
    )
}
