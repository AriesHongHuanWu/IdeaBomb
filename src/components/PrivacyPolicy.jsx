import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'

export default function PrivacyPolicy() {
    const navigate = useNavigate()

    React.useEffect(() => {
        document.title = 'Privacy Policy - IdeaBomb'
    }, [])

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px', fontFamily: '"Google Sans", "Inter", sans-serif', color: '#202124' }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#5f6368', fontSize: '1rem', marginBottom: 40, padding: 0 }}>
                <FiArrowLeft /> Back to Home
            </button>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: 20 }}>Privacy Policy</h1>
            <p style={{ color: '#5f6368', marginBottom: 40 }}>Last updated: December 8, 2025</p>

            <section style={{ marginBottom: 30 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 15 }}>1. Information We Collect</h2>
                <p style={{ lineHeight: 1.6, color: '#4a4a4a' }}>
                    We collect information you provide directly to us, such as when you create an account (via Google Auth), create a board, or communicate with us.
                </p>
            </section>

            <section style={{ marginBottom: 30 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 15 }}>2. How We Use Your Information</h2>
                <p style={{ lineHeight: 1.6, color: '#4a4a4a' }}>
                    We use the information we collect to provide, maintain, and improve our Service, including to:
                    <ul style={{ paddingLeft: 20, marginTop: 10 }}>
                        <li>Authenticate your identity.</li>
                        <li>Enable real-time collaboration with other users.</li>
                        <li>Provide AI-powered features via Gemini API.</li>
                    </ul>
                </p>
            </section>

            <section style={{ marginBottom: 30 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 15 }}>3. Data Security</h2>
                <p style={{ lineHeight: 1.6, color: '#4a4a4a' }}>
                    We implement reasonable security measures to help protect your personal information. We utilize Firebase's secure infrastructure for authentication and data storage.
                </p>
            </section>

            <section style={{ marginBottom: 30 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 15 }}>4. Third-Party Services</h2>
                <p style={{ lineHeight: 1.6, color: '#4a4a4a' }}>
                    IdeaBomb uses Google Gemini API for AI functionalities. Data sent to the AI model is subject to Google's data processing terms.
                </p>
            </section>

            <section style={{ marginBottom: 30 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 15 }}>5. Contact Us</h2>
                <p style={{ lineHeight: 1.6, color: '#4a4a4a' }}>
                    If you have any questions about this Privacy Policy, please contact us at arieswu001@gmail.com.
                </p>
            </section>
        </div>
    )
}
