
/**
 * Service to interact with Google Calendar API
 */

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY; // If needed for public data, but for user data we use access token
// actually for Google Calendar API with user data we typically use the access token from the login

// We will pass the access token to these functions
export const listUpcomingEvents = async (accessToken) => {
    try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=' + (new Date()).toISOString(), {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Error fetching calendar events", error);
        throw error;
    }
};

export const createCalendarEvent = async (accessToken, event) => {
    try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error creating calendar event", error);
        throw error;
    }
};
