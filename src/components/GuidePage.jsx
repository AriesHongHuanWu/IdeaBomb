import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiBook, FiCpu, FiGrid, FiCommand, FiShare2, FiMousePointer } from 'react-icons/fi'

export default function GuidePage() {
    const navigate = useNavigate()

    useEffect(() => {
        document.title = 'User Guide - IdeaBomb'
    }, [])

    const scrollToSection = (id) => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <div style={{ fontFamily: '"Google Sans", "Inter", sans-serif', color: '#202124', background: '#f8f9fa', minHeight: '100vh', display: 'flex' }}>

            {/* Sidebar Navigation */}
            <div style={{ width: 280, padding: 30, background: 'white', borderRight: '1px solid #dadce0', position: 'fixed', height: '100vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 'bold', fontSize: '1.4rem', color: '#5f6368', marginBottom: 40, cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <div style={{ width: 24, height: 24, background: '#5f6368', borderRadius: 6 }}></div> IdeaBomb
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <NavButton onClick={() => scrollToSection('getting-started')} icon={<FiBook />} label="Getting Started" />
                    <NavButton onClick={() => scrollToSection('tools')} icon={<FiGrid />} label="Canvas Tools" />
                    <NavButton onClick={() => scrollToSection('ai')} icon={<FiCpu />} label="Mastering AI" />
                    <NavButton onClick={() => scrollToSection('collaboration')} icon={<FiShare2 />} label="Collaboration" />
                    <NavButton onClick={() => scrollToSection('shortcuts')} icon={<FiCommand />} label="Shortcuts" />
                </div>

                <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #eee' }}>
                    <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'none', color: '#5f6368', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <FiArrowLeft /> Back to Home
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ marginLeft: 280, flex: 1, padding: '60px 80px', maxWidth: 900 }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: 20 }}>IdeaBomb Guide</h1>
                <p style={{ fontSize: '1.2rem', color: '#5f6368', marginBottom: 60 }}>Complete documentation for the world's smartest AI whiteboard.</p>

                {/* Getting Started */}
                <Section id="getting-started" title="1. Getting Started">
                    <p>Welcome to IdeaBomb. To begin, simply sign in with your Google Account. We use secure Google Authentication, so no new passwords are needed.</p>
                    <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
                        <StepCard step="1" title="Sign In" desc="Click 'Login' on the homepage." />
                        <StepCard step="2" title="Dashboard" desc="View all your boards in one place." />
                        <StepCard step="3" title="Create" desc="Click '+' to start a new board." />
                    </div>
                </Section>

                {/* Canvas Tools */}
                <Section id="tools" title="2. Canvas Tools">
                    <p>The infinite canvas is your playground. Use the toolbar on the left to add content.</p>
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: 20, display: 'grid', gap: 15 }}>
                        <ToolItem icon={<div style={{ width: 20, height: 20, background: '#fbbc04', borderRadius: 4 }}></div>} title="Sticky Notes" desc="Great for brainstorming. Drag them from the toolbar." />
                        <ToolItem icon={<div style={{ width: 20, height: 20, border: '2px solid #333', borderRadius: 4 }}></div>} title="Shapes" desc="Rectangles and circles for flowcharts and diagrams." />
                        <ToolItem icon={<FiMousePointer />} title="Selection" desc="Click to select. Drag to move. Hold Shift to select multiple." />
                    </ul>
                    <TipBox>
                        <b>Pro Tip:</b> Double-click anywhere on the canvas to instantly create a text node.
                    </TipBox>
                </Section>

                {/* AI Features */}
                <Section id="ai" title="3. Mastering AI (Gemini Integration)">
                    <p>This is where IdeaBomb shines. Our integrated Gemini AI can understand your board's context.</p>
                    <div style={{ background: '#e8f0fe', border: '1px solid #d2e3fc', borderRadius: 12, padding: 25, marginTop: 20 }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#1967d2', display: 'flex', alignItems: 'center', gap: 10 }}><FiCpu /> How to use</h4>
                        <p style={{ marginBottom: 15 }}>Open the Chat (bottom right) or use a text node, and start your message with <b>@ai</b>.</p>

                        <div style={{ background: 'white', padding: 15, borderRadius: 8, fontFamily: 'monospace', color: '#333', marginBottom: 10 }}>
                            @ai Summarize the blue sticky notes into a project plan
                        </div>
                        <div style={{ background: 'white', padding: 15, borderRadius: 8, fontFamily: 'monospace', color: '#333', marginBottom: 10 }}>
                            @ai Suggest 5 marketing slogans for this product
                        </div>
                        <div style={{ background: 'white', padding: 15, borderRadius: 8, fontFamily: 'monospace', color: '#333' }}>
                            @ai Analyze the flowchart and find bottlenecks
                        </div>
                    </div>
                </Section>

                {/* Collaboration */}
                <Section id="collaboration" title="4. Real-time Collaboration">
                    <p>IdeaBomb syncs instantly. Share your board's URL with teammates (coming soon: email invites). You can see their cursors moving in real-time.</p>
                </Section>

                {/* Shortcuts */}
                <Section id="shortcuts" title="5. Keyboard Shortcuts">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                        <Shortcut keyName="Space + Drag" action="Pan Canvas" />
                        <Shortcut keyName="Mouse Wheel" action="Zoom In / Out" />
                        <Shortcut keyName="Delete / Backspace" action="Delete Selected" />
                        <Shortcut keyName="Ctrl + Z" action="Undo (Coming Soon)" />
                    </div>
                </Section>

                <div style={{ marginTop: 80, paddingTop: 40, borderTop: '1px solid #dadce0', color: '#5f6368', textAlign: 'center' }}>
                    IdeaBomb Documentation &copy; 2025
                </div>
            </div>
        </div>
    )
}

function Section({ id, title, children }) {
    return (
        <section id={id} style={{ marginBottom: 80, scrollMarginTop: 40 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: 20, color: '#202124' }}>{title}</h2>
            <div style={{ fontSize: '1.1rem', lineHeight: 1.6, color: '#4a4a4a' }}>
                {children}
            </div>
        </section>
    )
}

function NavButton({ onClick, icon, label }) {
    return (
        <button onClick={onClick} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px',
            border: 'none', background: 'transparent', width: '100%',
            textAlign: 'left', borderRadius: 8, cursor: 'pointer',
            color: '#5f6368', fontSize: '1rem', fontWeight: 500,
            transition: 'background 0.2s'
        }}
            onMouseEnter={(e) => e.target.style.background = '#f1f3f4'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
            {icon} {label}
        </button>
    )
}

function StepCard({ step, title, desc }) {
    return (
        <div style={{ flex: 1, padding: 20, background: 'white', border: '1px solid #dadce0', borderRadius: 8 }}>
            <div style={{ fontWeight: 700, color: '#1a73e8', marginBottom: 5 }}>Step {step}</div>
            <div style={{ fontWeight: 600, marginBottom: 5 }}>{title}</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>{desc}</div>
        </div>
    )
}

function ToolItem({ icon, title, desc }) {
    return (
        <li style={{ display: 'flex', alignItems: 'center', gap: 15, padding: 10, background: 'white', borderRadius: 8, border: '1px solid #eee' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: '#f8f9fa', borderRadius: 8 }}>{icon}</div>
            <div>
                <div style={{ fontWeight: 600, color: '#202124' }}>{title}</div>
                <div style={{ fontSize: '0.9rem', color: '#5f6368' }}>{desc}</div>
            </div>
        </li>
    )
}

function TipBox({ children }) {
    return (
        <div style={{ marginTop: 20, padding: 15, background: '#e6f4ea', color: '#137333', borderRadius: 8, borderLeft: '4px solid #34a853' }}>
            {children}
        </div>
    )
}

function Shortcut({ keyName, action }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: 'white', borderBottom: '1px solid #eee' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, background: '#f1f3f4', padding: '2px 8px', borderRadius: 4 }}>{keyName}</span>
            <span style={{ color: '#5f6368' }}>{action}</span>
        </div>
    )
}
