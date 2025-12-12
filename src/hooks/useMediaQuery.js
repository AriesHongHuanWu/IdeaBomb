import { useState, useEffect } from 'react'

export function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches
        }
        return false
    })

    useEffect(() => {
        if (typeof window === 'undefined') return

        const media = window.matchMedia(query)

        // Set initial value
        if (media.matches !== matches) {
            setMatches(media.matches)
        }

        const listener = (e) => setMatches(e.matches)
        media.addEventListener('change', listener)
        return () => media.removeEventListener('change', listener)
    }, [query]) // Removed `matches` from dependencies to prevent infinite loop

    return matches
}
