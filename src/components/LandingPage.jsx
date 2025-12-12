import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight, FiCheck, FiCpu, FiGrid, FiMessageSquare, FiChevronDown, FiSun, FiMoon, FiGlobe } from 'react-icons/fi'
import { useSettings } from '../App'
import { useMediaQuery } from '../hooks/useMediaQuery'

export default function LandingPage({ user }) {
    const navigate = useNavigate()
    const { theme, setSettings, settings, t } = useSettings()
    const isMobile = useMediaQuery('(max-width: 768px)')

    React.useEffect(() => {
        document.title = 'IdeaBomb - Collaborative Whiteboard'
    }, [])

    return (
        <div style={{ fontFamily: '"Google Sans", "Inter", sans-serif', width: '100vw', minHeight: '100vh', background: theme.bg, color: theme.text, overflowX: 'hidden', transition: 'background 0.3s, color 0.3s' }}>

            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '15px 20px' : '20px 40px', background: theme.header, backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 'bold', fontSize: '1.4rem', color: '#5f6368' }}>
                    <img src="/logo.svg" alt="IdeaBomb" style={{ height: 24 }} /> IdeaBomb
                </div>
                <nav style={{ display: 'flex', gap: isMobile ? 15 : 30, alignItems: 'center' }}>
                    {!isMobile && (
                        <>
                            <a href="#features" style={{ textDecoration: 'none', color: theme.text, fontWeight: 500, opacity: 0.8 }}>{t('features')}</a>
                            <a href="#tutorial" style={{ textDecoration: 'none', color: theme.text, fontWeight: 500, opacity: 0.8 }}>{t('howItWorks')}</a>
                            <a href="#pricing" style={{ textDecoration: 'none', color: theme.text, fontWeight: 500, opacity: 0.8 }}>{t('pricing')}</a>
                        </>
                    )}
                    <button onClick={() => navigate(user ? '/dashboard' : '/login')} style={{ padding: '8px 20px', background: '#1a73e8', border: 'none', borderRadius: 4, color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                        {user ? t('dashboard') : t('signIn')}
                    </button>
                </nav>
            </header>

            {/* Hero Section */}
            <section style={{ padding: isMobile ? '60px 20px' : '100px 20px', textAlign: 'center', maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {/* Aurora Background Effect */}
                <div style={{ position: 'absolute', top: -150, left: '50%', transform: 'translateX(-50%)', width: '120%', height: 600, background: 'radial-gradient(circle at 50% 50%, rgba(66, 133, 244, 0.15) 0%, rgba(255, 255, 255, 0) 60%)', filter: 'blur(60px)', zIndex: -1, pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', top: -100, left: '20%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(234, 67, 53, 0.08) 0%, rgba(255, 255, 255, 0) 70%)', filter: 'blur(50px)', zIndex: -1, pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', top: 50, right: '20%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(52, 168, 83, 0.08) 0%, rgba(255, 255, 255, 0) 70%)', filter: 'blur(50px)', zIndex: -1, pointerEvents: 'none' }}></div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <div style={{ background: '#e8f0fe', color: '#1967d2', padding: '6px 16px', borderRadius: 20, fontSize: '0.9rem', fontWeight: 600, display: 'inline-block', marginBottom: 20 }}>
                        ✨ Now with Gemini AI Integration
                    </div>
                    <UserCountBadge theme={theme} />
                    <h1 style={{ fontSize: isMobile ? '2.5rem' : '4.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: 20, color: theme.text, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #1a73e8, #8ab4f8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', whiteSpace: 'pre-wrap' }}>
                        {t('heroTitle')}
                    </h1>
                    <p style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', color: theme.text, opacity: 0.7, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px auto', lineHeight: 1.6 }}>
                        {t('heroDesc')}
                    </p>
                    <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
                        <button onClick={() => navigate(user ? '/dashboard' : '/login')} style={{ padding: '15px 40px', fontSize: '1.1rem', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, boxShadow: '0 10px 25px rgba(26, 115, 232, 0.3)' }}>
                            {t('ctaStart')}
                        </button>
                        <button style={{ padding: '15px 40px', fontSize: '1.1rem', background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                            {t('ctaDemo')} <FiArrowRight />
                        </button>
                    </div>
                </motion.div>

                {/* Hero Image Mockup - Responsive */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 1 }} style={{ marginTop: 80, width: '100%', borderRadius: 16, border: `1px solid ${theme.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', overflow: 'hidden', maxWidth: 1000, position: 'relative' }}>
                    <div style={{ background: '#f1f3f4', padding: '12px 20px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }}></div>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }}></div>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }}></div>
                        {!isMobile && <div style={{ background: 'white', borderRadius: 4, flex: 1, margin: '0 20px', height: 28, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: '0.8rem', color: '#888' }}>ideabomb.app/board/system-architecture</div>}
                    </div>
                    {/* Interactive Animated Demo */}
                    <AnimatedDemoCanvas isMobile={isMobile} />
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" style={{ padding: isMobile ? '60px 20px' : '80px 20px', background: theme.bg }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#202124', marginBottom: 20 }}>{t('whyChoose')}</h2>
                        <p style={{ fontSize: '1.2rem', color: '#5f6368' }}>{t('whyDesc')}</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
                        <FeatureCard icon={<FiGrid size={40} color="#1a73e8" />} title={t('infiniteCanvas')} desc={t('infiniteDesc')} theme={theme} />
                        <FeatureCard icon={<FiCpu size={40} color="#ea4335" />} title={t('aiIntegration')} desc={t('aiDesc')} theme={theme} />
                        <FeatureCard icon={<FiMessageSquare size={40} color="#34a853" />} title={t('realTime')} desc={t('realTimeDesc')} theme={theme} />
                    </div>
                </div>
            </section>

            {/* How It Works (Tutorial) Section */}
            <section id="tutorial" style={{ padding: isMobile ? '60px 20px' : '80px 20px', background: `${theme.bg} linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.03) 100%)` }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: theme.text, marginBottom: 20 }}>{t('hiwTitle')}</h2>
                        <p style={{ fontSize: '1.2rem', color: theme.text, opacity: 0.7 }}>{t('hiwDesc')}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: 40, marginTop: 40, alignItems: 'center' }}>
                        <TutorialStep number="1" title={t('step1')} desc={t('step1Desc')} theme={theme} />
                        <TutorialStep number="2" title={t('step2')} desc={t('step2Desc')} theme={theme} />
                        <TutorialStep number="3" title={t('step3')} desc={t('step3Desc')} theme={theme} />
                    </div>
                </div>
            </section>

            {/* Solutions Section */}
            <section id="solutions" style={{ padding: isMobile ? '60px 20px' : '80px 20px', background: theme.activeBg }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: theme.text, marginBottom: 20 }}>{t('solutions')}</h2>
                        <p style={{ fontSize: '1.2rem', color: theme.text, opacity: 0.7 }}>{t('solutionsDesc')}</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: 30 }}>
                        <div style={{ background: theme.cardBg, padding: 30, borderRadius: 12, border: `1px solid ${theme.border}` }}>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 10, color: theme.text }}>{t('designers')}</h4>
                            <p style={{ color: theme.text, opacity: 0.7 }}>{t('designersDesc')}</p>
                        </div>
                        <div style={{ background: theme.cardBg, padding: 30, borderRadius: 12, border: `1px solid ${theme.border}` }}>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 10, color: theme.text }}>{t('engineers')}</h4>
                            <p style={{ color: theme.text, opacity: 0.7 }}>{t('engineersDesc')}</p>
                        </div>
                        <div style={{ background: theme.cardBg, padding: 30, borderRadius: 12, border: `1px solid ${theme.border}` }}>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 10, color: theme.text }}>{t('managers')}</h4>
                            <p style={{ color: theme.text, opacity: 0.7 }}>{t('managersDesc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" style={{ padding: isMobile ? '60px 20px' : '80px 20px', background: theme.bg }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: theme.text, marginBottom: 20 }}>{t('pricingTitle')}</h2>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 30, flexWrap: 'wrap', marginTop: 50, flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
                        {/* Free Tier */}
                        <div style={{ width: isMobile ? '100%' : 300, background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 24, textAlign: 'left', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: theme.text, marginBottom: 8 }}>{t('starter')}</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 400, color: theme.text, marginBottom: 8 }}>{t('free')} <span style={{ fontSize: '1rem', color: theme.text, opacity: 0.7 }}>{t('month')}</span></div>
                            <div style={{ fontSize: '0.875rem', color: '#1a73e8', fontWeight: 500, marginBottom: 24 }}>{t('freeFeat')}</div>

                            {user ? (
                                <button disabled style={{ width: '100%', padding: '10px 24px', background: theme.activeBg, border: 'none', color: theme.text, borderRadius: 4, fontWeight: 500, cursor: 'default', marginBottom: 32 }}>{t('currentPlan')}</button>
                            ) : (
                                <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '10px 24px', background: '#1a73e8', border: 'none', color: 'white', borderRadius: 4, fontWeight: 500, cursor: 'pointer', marginBottom: 32 }}>{t('getStarted')}</button>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: theme.text, opacity: 0.8, fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}><FiCheck style={{ color: '#1a73e8', marginRight: 12 }} /> {t('unlimitedBoards')}</div>
                                <div style={{ display: 'flex', alignItems: 'center' }}><FiCheck style={{ color: '#1a73e8', marginRight: 12 }} /> {t('realTime')}</div>
                                <div style={{ display: 'flex', alignItems: 'center' }}><FiCheck style={{ color: '#1a73e8', marginRight: 12 }} /> {t('basicAI')}</div>
                            </div>
                        </div>

                        {/* Pro Tier (Coming Soon) */}
                        <div style={{ width: isMobile ? '100%' : 300, background: theme.activeBg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 24, textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: theme.text, opacity: 0.7 }}>{t('pro')}</h3>
                                <span style={{ background: theme.cardBg, color: theme.text, opacity: 0.8, fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, fontWeight: 500, letterSpacing: '0.5px' }}>{t('comingSoon')}</span>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 400, color: theme.text, opacity: 0.7, marginBottom: 8 }}>{t('proPrice')} <span style={{ fontSize: '1rem', color: theme.text, opacity: 0.7 }}>{t('month')}</span></div>
                            <div style={{ fontSize: '0.875rem', color: theme.text, opacity: 0.7, marginBottom: 24 }}>{t('proDesc')}</div>

                            <button disabled style={{ width: '100%', padding: '10px 24px', background: theme.border, border: 'none', color: '#9aa0a6', borderRadius: 4, fontWeight: 500, cursor: 'not-allowed', marginBottom: 32 }}>{t('waitlist')}</button>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: theme.text, opacity: 0.7, fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}><FiCheck style={{ color: theme.border, marginRight: 12 }} /> {t('freeFeat')}</div>
                                <div style={{ display: 'flex', alignItems: 'center' }}><FiCheck style={{ color: '#5f6368', marginRight: 12 }} /> Advanced AI Models</div>
                                <div style={{ display: 'flex', alignItems: 'center' }}><FiCheck style={{ color: '#5f6368', marginRight: 12 }} /> Unlimited History</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" style={{ padding: isMobile ? '60px 20px' : '80px 20px', background: theme.bg }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: theme.text, marginBottom: 20 }}>{t('faq')}</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <FAQItem question={t('q1')} answer={t('a1')} theme={theme} />
                        <FAQItem question={t('q2')} answer={t('a2')} theme={theme} />
                        <FAQItem question={t('q3')} answer={t('a3')} theme={theme} />
                        <FAQItem question={t('q4')} answer={t('a4')} theme={theme} />
                    </div>
                </div>
            </section>

            {/* Footer with Contact Info */}
            <footer style={{ background: theme.activeBg, padding: isMobile ? '40px 20px' : '60px 40px', borderTop: `1px solid ${theme.border}` }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 'bold', fontSize: '1.2rem', color: theme.text, marginBottom: 20 }}>
                            <img src="/logo.svg" alt="IdeaBomb" style={{ height: 24, opacity: 0.7 }} /> IdeaBomb
                        </div>
                        <div style={{ color: theme.text, opacity: 0.7, fontSize: '0.9rem' }}>© 2025 IdeaBomb Inc. {t('rights')}</div>
                        <div style={{ color: theme.text, opacity: 0.6, fontSize: '0.8rem', marginTop: 10, fontWeight: 500 }}>{t('createdBy')}</div>
                        <div style={{ marginTop: 15, display: 'flex', gap: 15 }}>
                            <span onClick={() => navigate('/terms')} style={{ color: theme.text, opacity: 0.7, fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>{t('terms')}</span>
                            <span onClick={() => navigate('/privacy')} style={{ color: theme.text, opacity: 0.7, fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>{t('privacy')}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 60, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <span style={{ fontWeight: 600, color: theme.text }}>{t('product')}</span>
                            <a href="#" style={{ textDecoration: 'none', color: theme.text, opacity: 0.7, fontSize: '0.9rem' }}>{t('overview')}</a>
                            <span onClick={() => navigate('/guide')} style={{ color: theme.text, opacity: 0.7, fontSize: '0.9rem', cursor: 'pointer' }} onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>{t('userGuide')}</span>
                            <a href="#solutions" style={{ textDecoration: 'none', color: theme.text, opacity: 0.7, fontSize: '0.9rem' }}>{t('solutions')}</a>
                            <a href="#pricing" style={{ textDecoration: 'none', color: theme.text, opacity: 0.7, fontSize: '0.9rem' }}>{t('pricing')}</a>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <span style={{ fontWeight: 600, color: theme.text }}>{t('contact')}</span>
                            <div style={{ color: theme.text, opacity: 0.7, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                Email: <a href="mailto:arieswu001@gmail.com" style={{ color: '#1a73e8', textDecoration: 'none' }}>arieswu001@gmail.com</a>
                            </div>
                        </div>

                        {/* Settings Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <span style={{ fontWeight: 600, color: theme.text }}>{t('settings')}</span>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    onClick={() => setSettings(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }))}
                                    style={{
                                        background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`,
                                        padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {settings.theme === 'light' ? <FiMoon /> : <FiSun />} {settings.theme === 'light' ? 'Dark' : 'Light'}
                                </button>
                                <button
                                    onClick={() => setSettings(prev => ({ ...prev, lang: prev.lang === 'en' ? 'zh' : 'en' }))}
                                    style={{
                                        background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`,
                                        padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <FiGlobe /> {settings.lang === 'en' ? '中文' : 'English'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({ icon, title, desc, theme }) {
    return (
        <div style={{ padding: 30, background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 12, transition: 'transform 0.2s', cursor: 'default' }}>
            <div style={{ marginBottom: 20 }}>{icon}</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: theme.text, marginBottom: 12 }}>{title}</h3>
            <p style={{ fontSize: '1rem', color: theme.text, opacity: 0.7, lineHeight: 1.5 }}>{desc}</p>
        </div>
    )
}

function TutorialStep({ number, title, desc, theme }) {
    const isMobile = useMediaQuery('(max-width: 768px)')
    return (
        <div style={{ width: isMobile ? '100%' : 300, textAlign: 'left', position: 'relative', marginBottom: isMobile ? 30 : 0 }}>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: theme.text, opacity: 0.1, position: 'absolute', top: -30, left: -10, zIndex: 0 }}>{number}</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: theme.text, marginBottom: 15 }}>{title}</h3>
                <p style={{ fontSize: '1rem', color: theme.text, opacity: 0.7, lineHeight: 1.5 }}>{desc}</p>
            </div>
        </div>
    )
}

function FAQItem({ question, answer, theme }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div style={{ border: `1px solid ${theme.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <button onClick={() => setIsOpen(!isOpen)} style={{ width: '100%', padding: '20px', background: theme.cardBg, border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 500, color: theme.text }}>{question}</span>
                <FiChevronDown style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: theme.text, opacity: 0.7 }} />
            </button>
            {isOpen && (
                <div style={{ padding: '0 20px 20px 20px', background: theme.cardBg, color: theme.text, opacity: 0.8, lineHeight: 1.6 }}>
                    {answer}
                </div>
            )}
        </div>
    )
}

function UserCountBadge({ theme }) {
    const { t } = useSettings()
    const [count, setCount] = useState(null)

    React.useEffect(() => {
        let unsub = () => { }
        const fetchCount = async () => {
            try {
                const { doc, onSnapshot, getFirestore } = await import('firebase/firestore')
                const db = getFirestore()
                // Add error callback to suppress permission-denied spam if rules are lagging
                unsub = onSnapshot(doc(db, 'system', 'stats'), (d) => {
                    if (d.exists()) setCount(d.data().userCount)
                }, (error) => {
                    console.log("User count sync suppressed:", error.code)
                })
            } catch (e) {
                console.warn("Failed to load user count:", e)
            }
        }
        fetchCount()
        return () => unsub()
    }, [])

    if (!count) return null

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                margin: '0 auto 20px auto',
                display: 'flex',
                justifyContent: 'center',
                width: 'fit-content'
            }}
        >
            <div style={{
                background: theme.cardBg,
                color: theme.activeText,
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: `1px solid ${theme.border}`
            }}>
                <div style={{ display: 'flex', marginLeft: -5 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: '#ccc', border: `2px solid ${theme.cardBg}`, marginLeft: -4, overflow: 'hidden' }}>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} width="100%" height="100%" />
                        </div>
                    ))}
                </div>
                {t('trustedBy')} {count.toLocaleString()}+ {t('users')}
            </div>
        </motion.div>
    )
}

function AnimatedDemoCanvas({ isMobile }) {
    // 3D Glass Effect Styles
    const glassStyle = {
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    }

    // 3D Floating Animation for the whole board
    return (
        <div style={{ height: isMobile ? 400 : 700, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', position: 'relative', overflow: 'hidden', fontFamily: '"Google Sans", "Inter", sans-serif' }}>
            {/* Grid Background */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)', backgroundSize: '32px 32px', opacity: 0.8 }}></div>

            {/* Decorative 3D Glass Orbs */}
            <motion.div animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', opacity: 0.6, filter: 'blur(40px)' }}></motion.div>
            <motion.div animate={{ y: [0, 30, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} style={{ position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, borderRadius: '50%', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', opacity: 0.6, filter: 'blur(30px)' }}></motion.div>

            {/* Mock Toolbar - Top Center (Floating Glass) */}
            <motion.div
                initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
                style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    borderRadius: 16, padding: '10px 20px', display: 'flex', gap: 16, alignItems: 'center', zIndex: 100,
                    ...glassStyle
                }}
            >
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 32, height: 32, background: '#f1f3f4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5f6368' }}><FiGrid /></div>
                    <div style={{ width: 32, height: 32, background: '#e8f0fe', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a73e8' }}><FiCpu /></div>
                    <div style={{ width: 32, height: 32, background: '#fce8e6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea4335' }}><FiMessageSquare /></div>
                </div>
                <div style={{ width: 1, height: 24, background: '#dadce0' }}></div>
                <div style={{ display: 'flex', gap: -8 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: '#fff', border: '2px solid white', overflow: 'hidden', marginLeft: -8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i + 5}`} width="100%" height="100%" />
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Content Group: Research Topic (Market Analysis) */}

            {/* 1. Central Topic Node (Glass) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
                style={{
                    position: 'absolute', top: isMobile ? 80 : 150, left: isMobile ? '50%' : 150, transform: isMobile ? 'translateX(-50%)' : 'none',
                    width: isMobile ? 260 : 280, borderRadius: 16, padding: 20, zIndex: 10,
                    ...glassStyle
                }}
            >
                <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10, color: '#202124' }}>
                    <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>🌍</span> Global Trends 2025
                </div>
                <div style={{ fontSize: '0.9rem', color: '#5f6368', lineHeight: 1.5 }}>
                    Researching renewable energy adoption rates across Asia and Europe.
                </div>
                <div style={{ marginTop: 15, display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', background: '#e8f0fe', color: '#1967d2', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>#research</span>
                    <span style={{ fontSize: '0.75rem', background: '#fce8e6', color: '#c5221f', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>#urgent</span>
                </div>
            </motion.div>

            {/* 2. Youtube Video Embed (Simulated -> CSS Chart + Glass) */}
            <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                style={{
                    position: 'absolute', top: isMobile ? 280 : 100, left: isMobile ? 20 : 550,
                    width: isMobile ? 200 : 320, height: isMobile ? 120 : 180,
                    borderRadius: 16, overflow: 'hidden', zIndex: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                    ...glassStyle,
                    background: 'rgba(255, 255, 255, 0.6)' // Slightly more opaque for content visibility
                }}
            >
                {/* CSS Bar Chart Mock */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: '60%', marginBottom: 10 }}>
                    <div style={{ width: 24, height: '40%', background: '#ffbdcb', borderRadius: 4 }}></div>
                    <div style={{ width: 24, height: '70%', background: '#ff80ab', borderRadius: 4 }}></div>
                    <div style={{ width: 24, height: '55%', background: '#f48fb1', borderRadius: 4 }}></div>
                    <div style={{ width: 24, height: '90%', background: '#ec407a', borderRadius: 4 }}></div>
                    <div style={{ width: 24, height: '65%', background: '#d81b60', borderRadius: 4 }}></div>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#333' }}>Market Growth 2025 📈</div>
            </motion.div>

            {/* 3. Image/Moodboard Node (CSS Blueprint + Glass) */}
            <motion.div
                initial={{ opacity: 0, rotate: 5 }} animate={{ opacity: 1, rotate: 3 }} transition={{ duration: 0.6, delay: 0.5 }}
                style={{
                    position: 'absolute', top: isMobile ? 380 : 350, left: isMobile ? 150 : 600,
                    width: 200, padding: 16, borderRadius: 8,
                    transform: 'rotate(3deg)', zIndex: 9,
                    ...glassStyle
                }}
            >
                {/* CSS Blueprint Mock */}
                <div style={{ width: '100%', height: 100, background: '#e3f2fd', borderRadius: 4, position: 'relative', overflow: 'hidden', border: '1px solid #90caf9' }}>
                    <div style={{ position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, border: '2px dashed #1e88e5', borderRadius: 4 }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 40, height: 40, background: '#2196f3', borderRadius: '50%', opacity: 0.3 }}></div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#1565c0', marginTop: 12, textAlign: 'center', fontFamily: 'monospace', letterSpacing: 1, fontWeight: 'bold' }}>SOLAR_LAYOUT_V2</div>
            </motion.div>

            {/* 4. Sticky Note Cluster */}
            <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: 'spring' }}
                style={{ position: 'absolute', top: 320, left: 200, display: isMobile ? 'none' : 'block' }}
            >
                <div style={{ width: 140, height: 140, background: '#fff9c4', boxShadow: '2px 4px 12px rgba(0,0,0,0.1)', padding: 15, fontFamily: '"Kalam", cursive', fontSize: '1rem', rotate: '-5deg' }}>
                    Don't forget the EU policy changes! 🇪🇺
                </div>
            </motion.div>
            <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.0, type: 'spring' }}
                style={{ position: 'absolute', top: 360, left: 360, display: isMobile ? 'none' : 'block' }}
            >
                <div style={{ width: 140, height: 140, background: '#e1bee7', boxShadow: '2px 4px 12px rgba(0,0,0,0.1)', padding: 15, fontFamily: '"Kalam", cursive', fontSize: '1rem', rotate: '3deg' }}>
                    Interview Dr. Smith on Friday 📅
                </div>
            </motion.div>

            {/* Cursors */}
            {/* User 1 */}
            <motion.div
                initial={{ x: 600, y: 150 }}
                animate={{ x: [600, 300, 300, 600], y: [150, 350, 400, 150] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', zIndex: 50, pointerEvents: 'none' }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                    <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19135L11.4841 12.3673H5.65376Z" fill="#9333ea" stroke="white" strokeWidth="1" />
                </svg>
                <div style={{ background: '#9333ea', padding: '2px 8px', borderRadius: 4, color: 'white', fontSize: '10px', marginLeft: 12, marginTop: 0, fontWeight: 600 }}>Alice (Researcher)</div>
            </motion.div>

            {/* Animated Connections */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                <motion.path
                    d={isMobile ? "" : "M 440 200 C 500 200, 520 200, 550 200"}
                    stroke="#ccc" strokeWidth="3" strokeDasharray="5,5" fill="none"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 1 }}
                />
            </svg>

        </div>
    )
}
