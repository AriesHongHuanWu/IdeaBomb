import React from 'react'
import { motion } from 'framer-motion'

export default function LogoLoader() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw',
            background: '#ffffff',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                    opacity: 1,
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
                <img src="/logo.svg" alt="Loading" style={{ height: 60 }} />

                <motion.div
                    style={{
                        marginTop: 20,
                        height: 4,
                        width: 100,
                        background: '#f1f3f4',
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    <motion.div
                        animate={{ x: [-100, 100] }}
                        transition={{
                            repeat: Infinity,
                            duration: 1,
                            ease: "linear"
                        }}
                        style={{
                            height: '100%',
                            width: '50%',
                            background: 'linear-gradient(90deg, transparent, #1a73e8, transparent)',
                            borderRadius: 2
                        }}
                    />
                </motion.div>
            </motion.div>
        </div>
    )
}
