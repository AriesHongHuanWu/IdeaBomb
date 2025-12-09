import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'framer-motion', 'react-icons'],
                    firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/analytics']
                }
            }
        }
    }
})
