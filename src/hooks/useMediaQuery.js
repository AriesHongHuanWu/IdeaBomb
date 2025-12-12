import { useState, useEffect } from 'react'

// Minimal reliable implementation - no useCallback to avoid hook order issues
export function useMediaQuery(query) {
    // Lazy initializer - runs only once
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.matchMedia(query).matches
    })

    useEffect(() => {
        if (typeof window === 'undefined') return

        const media = window.matchMedia(query)
        const handler = () => setMatches(media.matches)

        // Sync on mount
        setMatches(media.matches)

        media.addEventListener('change', handler)
        return () => media.removeEventListener('change', handler)
    }, [query])

    return matches
}
