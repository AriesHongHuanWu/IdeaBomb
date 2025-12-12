import { useState, useEffect, useSyncExternalStore } from 'react'

// Simple, bulletproof implementation using useSyncExternalStore
export function useMediaQuery(query) {
    const subscribe = (callback) => {
        if (typeof window === 'undefined') return () => { }
        const media = window.matchMedia(query)
        media.addEventListener('change', callback)
        return () => media.removeEventListener('change', callback)
    }

    const getSnapshot = () => {
        if (typeof window === 'undefined') return false
        return window.matchMedia(query).matches
    }

    const getServerSnapshot = () => false

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
