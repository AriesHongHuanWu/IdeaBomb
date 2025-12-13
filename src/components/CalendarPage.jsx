import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useGoogleLogin } from '@react-oauth/google'
import { listUpcomingEvents, createCalendarEvent } from '../services/calendarService'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiPlus, FiCalendar } from 'react-icons/fi'
import { useSettings } from '../App'

const localizer = momentLocalizer(moment)

export default function CalendarPage() {
    const navigate = useNavigate()
    const { theme } = useSettings()
    const [events, setEvents] = useState([])
    const [accessToken, setAccessToken] = useState(null)
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [newEvent, setNewEvent] = useState({ title: '', start: new Date(), end: new Date() })

    const login = useGoogleLogin({
        onSuccess: (codeResponse) => {
            setAccessToken(codeResponse.access_token)
            setIsAuthorized(true)
            fetchEvents(codeResponse.access_token)
        },
        onError: (error) => console.log('Login Failed:', error),
        scope: 'https://www.googleapis.com/auth/calendar.events'
    })

    const fetchEvents = async (token) => {
        try {
            const googleEvents = await listUpcomingEvents(token)
            const formattedEvents = googleEvents.map(event => ({
                id: event.id,
                title: event.summary || 'No Title',
                start: new Date(event.start.dateTime || event.start.date),
                end: new Date(event.end.dateTime || event.end.date),
                allDay: !event.start.dateTime
            }))
            setEvents(formattedEvents)
        } catch (error) {
            console.error("Failed to fetch events", error)
        }
    }

    const handleSelectSlot = ({ start, end }) => {
        if (!isAuthorized) return login()
        setNewEvent({ ...newEvent, start, end })
        setShowModal(true)
    }

    const handleSaveEvent = async () => {
        if (!newEvent.title) return

        const eventBody = {
            summary: newEvent.title,
            start: { dateTime: newEvent.start.toISOString() },
            end: { dateTime: newEvent.end.toISOString() }
        }

        try {
            await createCalendarEvent(accessToken, eventBody)
            setShowModal(false)
            setNewEvent({ title: '', start: new Date(), end: new Date() })
            fetchEvents(accessToken) // Refresh
        } catch (error) {
            alert('Failed to save event')
        }
    }

    return (
        <div style={{ background: theme.bg, minHeight: '100vh', color: theme.text, padding: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 20 }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: 'none', color: theme.text, fontSize: '1.5rem', cursor: 'pointer' }}>
                    <FiArrowLeft />
                </button>
                <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FiCalendar /> Google Calendar
                </h1>
                {!isAuthorized ? (
                    <button onClick={() => login()} style={{ marginLeft: 'auto', padding: '10px 20px', background: '#4285F4', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' }}>
                        Sign in with Google
                    </button>
                ) : (
                    <button onClick={() => setShowModal(true)} style={{ marginLeft: 'auto', padding: '10px 20px', background: '#34A853', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <FiPlus /> New Event
                    </button>
                )}
            </div>

            {/* Calendar */}
            <div style={{ height: 'calc(100vh - 100px)', background: theme.cardBg, padding: 20, borderRadius: 10, border: `1px solid ${theme.border}` }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={(event) => alert(event.title)}
                />
            </div>

            {/* Simple Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: 30, borderRadius: 10, width: 400 }}>
                        <h2 style={{ color: 'black', marginTop: 0 }}>New Event</h2>
                        <input
                            type="text"
                            placeholder="Event Title"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            style={{ width: '100%', padding: 10, marginBottom: 15, borderRadius: 5, border: '1px solid #ccc' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button onClick={() => setShowModal(false)} style={{ padding: '8px 15px', background: '#ccc', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSaveEvent} style={{ padding: '8px 15px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
