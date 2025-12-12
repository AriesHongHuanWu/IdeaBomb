import { useSyncExternalStore } from 'react'

export function useMediaQuery(query) {
    const subscribe = (callback) => {
        const matchMedia = window.matchMedia(query)
        matchMedia.addEventListener('change', callback)
        return () => {
            matchMedia.removeEventListener('change', callback)
        }
    }

    const getSnapshot = () => {
        return window.matchMedia(query).matches
    }

    const getServerSnapshot = () => {
        return false // Safe default for SSR
    }

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
