import { useState, useEffect, useCallback } from 'react'

// Simple useState/useEffect implementation - most reliable
export function useMediaQuery(query) {
    const getMatches = useCallback(() => {
        if (typeof window === 'undefined') return false
        return window.matchMedia(query).matches
    }, [query])

    const [matches, setMatches] = useState(getMatches)

    useEffect(() => {
        if (typeof window === 'undefined') return

        const media = window.matchMedia(query)

        // Update immediately if needed (without causing loop)
        const updateMatches = () => setMatches(media.matches)

        media.addEventListener('change', updateMatches)

        // Initial sync - only once on mount/query change
        setMatches(media.matches)

        return () => media.removeEventListener('change', updateMatches)
    }, [query])

    return matches
}
