// Scripts for firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// ⚠️ IMPORTANT: These values must be replaced with your actual Firebase config keys
// Because this file is static in /public, it cannot read .env files at runtime.
firebase.initializeApp({
    apiKey: "AIzaSyDt22yhbuJzEfRTjOyCp1IlCM8K61ILLLc",
    authDomain: "ideaboard-b88c0.firebaseapp.com",
    projectId: "ideaboard-b88c0",
    storageBucket: "ideaboard-b88c0.firebasestorage.app",
    messagingSenderId: "932999439710",
    appId: "1:932999439710:web:333abc2bbae78ef7001bcf",
    measurementId: "G-X2JHL52WFB"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background Push:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png' // Android/Desktop badge
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
