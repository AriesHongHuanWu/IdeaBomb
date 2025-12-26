import React, { useState, useEffect } from 'react';
import { messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import { useSettings } from '../App';
import { FiBell, FiCheck } from 'react-icons/fi';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function NotificationManager({ user }) {
    const [token, setToken] = useState(null);
    const [permission, setPermission] = useState('default'); // 'default', 'granted', 'denied'
    const { theme } = useSettings();

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!messaging) return alert("Messaging not supported.");

        try {
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult === 'granted') {
                const currentToken = await getToken(messaging, {
                    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
                });

                if (currentToken) {
                    setToken(currentToken);
                    console.log("FCM Token:", currentToken);
                    // Save to user profile AND lookup table
                    if (user) {
                        await updateDoc(doc(db, 'users', user.uid), { fcmToken: currentToken });
                        // Save by email for easy lookup by other users
                        await setDoc(doc(db, 'fcm_tokens', user.email), {
                            token: currentToken,
                            uid: user.uid,
                            updatedAt: new Date()
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Notification error:', err);
        }
    };

    return (
        <div style={{ padding: 20, border: `1px solid ${theme.border}`, borderRadius: 8, marginTop: 20 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiBell /> Push Notifications (Beta)
            </h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                Enable notifications to receive updates when collaborators change the board.
                (Requires 'Add to Home Screen' on iOS)
            </p>

            {permission === 'granted' ? (
                <button disabled style={{
                    padding: '8px 16px', borderRadius: 4, border: 'none',
                    background: '#e6fffa', color: '#047857', display: 'flex', gap: 8
                }}>
                    <FiCheck /> Active
                </button>
            ) : permission === 'denied' ? (
                <div style={{ color: '#ef4444' }}>Notifications Blocked. Please enable in browser settings.</div>
            ) : (
                <button onClick={requestPermission} style={{
                    padding: '8px 16px', borderRadius: 4, border: 'none',
                    background: '#1a73e8', color: 'white', cursor: 'pointer'
                }}>
                    Enable Notifications
                </button>
            )}
        </div>
    );
}
