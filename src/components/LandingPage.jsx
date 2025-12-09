import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight, FiCheck, FiCpu, FiGrid, FiMessageSquare, FiChevronDown } from 'react-icons/fi'
import { useMediaQuery } from '../hooks/useMediaQuery'

export default function LandingPage({ user }) {
    const navigate = useNavigate()
    const isMobile = useMediaQuery('(max-width: 768px)')

    React.useEffect(() => {
        document.title = 'IdeaBomb - Collaborative Whiteboard'
    }, [])

    return (
        <div style={{ fontFamily: '"Google Sans", "Inter", sans-serif', width: '100vw', minHeight: '100vh', background: '#ffffff', color: '#202124', overflowX: 'hidden' }}>

            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '15px 20px' : '20px 40px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 'bold', fontSize: '1.4rem', color: '#5f6368' }}>
                    <div style={{ width: 24, height: 24, background: '#5f6368', borderRadius: 6 }}></div> IdeaBomb
                </div>
                <nav style={{ display: 'flex', gap: isMobile ? 15 : 30, alignItems: 'center' }}>
                    {!isMobile && (
                        <>
                            <a href="#features" style={{ textDecoration: 'none', color: '#5f6368', fontWeight: 500 }}>Features</a>
                            <a href="#tutorial" style={{ textDecoration: 'none', color: '#5f6368', fontWeight: 500 }}>How It Works</a>
                            <a href="#pricing" style={{ textDecoration: 'none', color: '#5f6368', fontWeight: 500 }}>Pricing</a>
                        </>
                    )}
                    <button onClick={() => navigate(user ? '/dashboard' : '/login')} style={{ padding: '8px 20px', background: '#1a73e8', border: 'none', borderRadius: 4, color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                        {user ? 'Dashboard' : 'Sign In'}
                    </button>
                </nav>
            </header>

            {/* Hero Section */}
            <section style={{ padding: isMobile ? '60px 20px' : '100px 20px', textAlign: 'center', maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <div style={{ background: '#e8f0fe', color: '#1967d2', padding: '6px 16px', borderRadius: 20, fontSize: '0.9rem', fontWeight: 600, display: 'inline-block', marginBottom: 20 }}>
                        ✨ Now with Gemini AI Integration
                    </div>
                    <h1 style={{ fontSize: isMobile ? '2.5rem' : '4rem', fontWeight: 800, lineHeight: 1.1, marginBottom: 20, color: '#202124' }}>
                        Think Bigger.<br /> Collaborate Smarter.
                    </h1>
                    <p style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', color: '#5f6368', marginBottom: 40, maxWidth: 600, margin: '0 auto 40px auto', lineHeight: 1.6 }}>
                        The infinite canvas for engineering teams. Brainstorm, plan, and build with the power of Google's Gemini AI.
                    </p>
                    <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
                        <button onClick={() => navigate(user ? '/dashboard' : '/login')} style={{ padding: '15px 40px', fontSize: '1.1rem', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, boxShadow: '0 10px 25px rgba(26, 115, 232, 0.3)' }}>
                            Start Whiteboarding Free
                        </button>
                        <button style={{ padding: '15px 40px', fontSize: '1.1rem', background: 'white', color: '#5f6368', border: '1px solid #dadce0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                            View Demo <FiArrowRight />
                        </button>
                    </div>
                </motion.div>

                {/* Hero Image Mockup - Responsive */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 1 }} style={{ marginTop: 80, width: '100%', borderRadius: 16, border: '1px solid #dadce0', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', overflow: 'hidden', maxWidth: 1000 }}>
                    <div style={{ background: '#f1f3f4', padding: '12px 20px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }}></div>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }}></div>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }}></div>
                        {!isMobile && <div style={{ background: 'white', borderRadius: 4, flex: 1, margin: '0 20px', height: 28, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: '0.8rem', color: '#888' }}>ideabomb.app/board/marketing-plan</div>}
                    </div>
                    {/* High Contrast Mockup Container */}
                    <div style={{ height: isMobile ? 300 : 500, background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#e0e0e0 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }}></div>

                        {/* Left Sidebar Mockup */}
                        {!isMobile && (
                            <div style={{ position: 'absolute', top: 20, bottom: 20, left: 20, width: 60, background: '#fff', borderRadius: 8, border: '1px solid #dadce0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 15, gap: 20, zIndex: 10 }}>
                                <div style={{ width: 32, height: 32, background: '#e8f0fe', borderRadius: 8, border: '1px solid #d2e3fc' }}></div>
                                <div style={{ width: 24, height: 24, background: '#f1f3f4', borderRadius: 4 }}></div>
                                <div style={{ width: 24, height: 24, background: '#f1f3f4', borderRadius: 4 }}></div>
                                <div style={{ width: 24, height: 24, background: '#f1f3f4', borderRadius: 4 }}></div>
                            </div>
                        )}

                        {/* Node 1 */}
                        <div style={{ position: 'absolute', top: isMobile ? 40 : 80, left: isMobile ? 40 : 140, width: isMobile ? 160 : 200, height: isMobile ? 100 : 120, background: '#fff', border: '2px solid #4285f4', borderRadius: 8, padding: 20, boxShadow: '0 4px 15px rgba(66,133,244,0.15)', zIndex: 5 }}>
                            <div style={{ width: '80%', height: 12, background: '#e0e0e0', borderRadius: 4, marginBottom: 15 }}></div>
                            <div style={{ width: '100%', height: 8, background: '#f0f0f0', borderRadius: 4, marginBottom: 8 }}></div>
                            <div style={{ width: '100%', height: 8, background: '#f0f0f0', borderRadius: 4, marginBottom: 8 }}></div>
                        </div>

                        {/* Connecting Arrow */}
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                            <path d={isMobile ? "M 200 90 L 250 150" : "M 340 140 C 400 140, 420 200, 480 200"} stroke="#9aa0a6" strokeWidth="3" fill="none" />
                        </svg>

                        {/* Node 2 (AI Summary) */}
                        <div style={{ position: 'absolute', top: isMobile ? 160 : 160, left: isMobile ? 100 : 480, width: isMobile ? 200 : 240, height: 140, background: '#fff', border: '1px solid #dadce0', borderRadius: 8, padding: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', zIndex: 6, overflow: 'hidden' }}>
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
                        <div style={{ position: 'absolute', bottom: isMobile ? 20 : 40, right: isMobile ? 20 : 40, background: '#34a853', color: 'white', padding: isMobile ? '8px 16px' : '12px 24px', borderRadius: 30, fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(52,168,83,0.3)', zIndex: 20 }}>
                            ✨ @ai Analyze
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" style={{ padding: isMobile ? '60px 20px' : '80px 20px', background: '#fff' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#202124', marginBottom: 20 }}>Why choose IdeaBomb?</h2>
                        <p style={{ fontSize: '1.2rem', color: '#5f6368' }}>Bank-grade security meets consumer-grade simplicity.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
                        <FeatureCard icon={<FiGrid size={40} color="#1a73e8" />} title="Infinite Canvas" desc="Break free from page limits. Organize thoughts, flowcharts, and plans on an endless whiteboard." />
                        <FeatureCard icon={<FiCpu size={40} color="#ea4335" />} title="Gemini AI Integration" desc="Use @ai to summarize discussions, generate content, and organize your board automatically." />
                        <FeatureCard icon={<FiMessageSquare size={40} color="#34a853" />} title="Real-time Collaboration" desc="Chat, comment, and co-edit with your team instantly. See cursors and updates live." />
                    </div>
                </div>
            </section>

            {/* How It Works (Tutorial) Section */}
            <section id="tutorial" style={{ padding: isMobile ? '60px 20px' : '80px 20px', background: 'linear-gradient(180deg, #ffffff 0%, #f1f3f4 100%)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#202124', marginBottom: 20 }}>How It Works</h2>
                        <p style={{ fontSize: '1.2rem', color: '#5f6368' }}>Get started in seconds. Master it in minutes.</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: 40, marginTop: 40, alignItems: 'center' }}>
                        <TutorialStep number="1" title="Sign Up & Create" desc="Log in with your Google account and create your first unlimited whiteboard." />
                        <TutorialStep number="2" title="Invite Your Team" desc="Share the link or invite via email to collaborate in real-time." />
                        <TutorialStep number="3" title="Unleash AI" desc="Type @ai in the chat or context menu to brainstorm, summarize, and create content." />
                    </div>
                </div>
            </section>

            {/* Solutions Section */}
            <section id="solutions" style={{ padding: isMobile ? '60px 20px' : '80px 20px', background: '#f8f9fa' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#202124', marginBottom: 20 }}>Tailored Solutions</h2>
                        <p style={{ fontSize: '1.2rem', color: '#5f6368' }}>Empowering teams across every industry.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: 30 }}>
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
            <section id="pricing" style={{ padding: isMobile ? '60px 20px' : '80px 20px', background: '#fff' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#202124', marginBottom: 20 }}>Simple, Transparent Pricing</h2>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 30, flexWrap: 'wrap', marginTop: 50, flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
                        {/* Free Tier */}
                        <div style={{ width: isMobile ? '100%' : 300, background: 'white', border: '1px solid #dadce0', borderRadius: 8, padding: 24, textAlign: 'left', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#202124', marginBottom: 8 }}>Starter</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 400, color: '#202124', marginBottom: 8 }}>$0 <span style={{ fontSize: '1rem', color: '#5f6368' }}>/ month</span></div>
                            <div style={{ fontSize: '0.875rem', color: '#1a73e8', fontWeight: 500, marginBottom: 24 }}>All features free during Beta</div>

                            {user ? (
                                <button disabled style={{ width: '100%', padding: '10px 24px', background: '#e8f0fe', border: 'none', color: '#1967d2', borderRadius: 4, fontWeight: 500, cursor: 'default', marginBottom: 32 }}>Current Plan</button>
                            ) : (
                                <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '10px 24px', background: '#1a73e8', border: 'none', color: 'white', borderRadius: 4, fontWeight: 500, cursor: 'pointer', marginBottom: 32 }}>Get Started</button>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: '#3c4043', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}><FiCheck style={{ color: '#1a73e8', marginRight: 12 }} /> Unlimited Boards</div>
                                <div style={{ display: 'flex', alignItems: 'center' }}><FiCheck style={{ color: '#1a73e8', marginRight: 12 }} /> Real-time Collaboration</div>
                                <div style={{ display: 'flex', alignItems: 'center' }}><FiCheck style={{ color: '#1a73e8', marginRight: 12 }} /> Basic AI (Flash-Lite)</div>
                            </div>
                        </div>

                        {/* Pro Tier (Coming Soon) */}
                        <div style={{ width: isMobile ? '100%' : 300, background: '#f8f9fa', border: '1px solid #dadce0', borderRadius: 8, padding: 24, textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#5f6368' }}>Pro</h3>
                                <span style={{ background: '#f1f3f4', color: '#5f6368', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, fontWeight: 500, letterSpacing: '0.5px' }}>COMING SOON</span>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 400, color: '#5f6368', marginBottom: 8 }}>$2 <span style={{ fontSize: '1rem', color: '#5f6368' }}>/ month</span></div>
                            <div style={{ fontSize: '0.875rem', color: '#5f6368', marginBottom: 24 }}>For power users</div>

                            <button disabled style={{ width: '100%', padding: '10px 24px', background: '#e0e0e0', border: 'none', color: '#9aa0a6', borderRadius: 4, fontWeight: 500, cursor: 'not-allowed', marginBottom: 32 }}>Join Waitlist</button>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: '#5f6368', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}><FiCheck style={{ color: '#dadce0', marginRight: 12 }} /> Everything in Starter</div>
                                <div style={{ display: 'flex', alignItems: 'center' }}><FiCheck style={{ color: '#5f6368', marginRight: 12 }} /> Advanced AI Models</div>
                                <div style={{ display: 'flex', alignItems: 'center' }}><FiCheck style={{ color: '#5f6368', marginRight: 12 }} /> Unlimited History</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" style={{ padding: isMobile ? '60px 20px' : '80px 20px', background: '#fff' }}>
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
            <footer style={{ background: '#f8f9fa', padding: isMobile ? '40px 20px' : '60px 40px', borderTop: '1px solid #dadce0' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40 }}>
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
                    <div style={{ display: 'flex', gap: 60, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <span style={{ fontWeight: 600, color: '#202124' }}>Product</span>
                            <a href="#" style={{ textDecoration: 'none', color: '#5f6368', fontSize: '0.9rem' }}>Overview</a>
                            <span onClick={() => navigate('/guide')} style={{ color: '#5f6368', fontSize: '0.9rem', cursor: 'pointer' }} onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>User Guide</span>
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
    const isMobile = useMediaQuery('(max-width: 768px)')
    return (
        <div style={{ width: isMobile ? '100%' : 300, textAlign: 'left', position: 'relative', marginBottom: isMobile ? 30 : 0 }}>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: '#e8eaed', opacity: 0.8, position: 'absolute', top: -30, left: -10, zIndex: 0 }}>{number}</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#202124', marginBottom: 15 }}>{title}</h3>
                <p style={{ fontSize: '1rem', color: '#5f6368', lineHeight: 1.5 }}>{desc}</p>
            </div>
        </div>
    )
}

function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div style={{ border: '1px solid #dadce0', borderRadius: 8, overflow: 'hidden' }}>
            <button onClick={() => setIsOpen(!isOpen)} style={{ width: '100%', padding: '20px', background: 'white', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 500, color: '#202124' }}>{question}</span>
                <FiChevronDown style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#5f6368' }} />
            </button>
            {isOpen && (
                <div style={{ padding: '0 20px 20px 20px', background: 'white', color: '#5f6368', lineHeight: 1.6 }}>
                    {answer}
                </div>
            )}
        </div>
    )
}
