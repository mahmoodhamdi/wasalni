/* eslint-disable no-undef */
// Firebase Cloud Messaging service worker. Loaded when the user enables
// push notifications. We import the compat scripts at the top because
// Firebase's modular SDK doesn't fully support service workers yet.
//
// IMPORTANT: This file is served from /public, so config values must be
// public (NEXT_PUBLIC_* equivalents). The VAPID key is configured by the
// browser side, not here.

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Read public config from the registration query string:
//   navigator.serviceWorker.register('/firebase-messaging-sw.js?...')
// so we don't hard-code per-environment values into a committed file.
const params = new URLSearchParams(self.location.search);

self.firebase.initializeApp({
  apiKey: params.get('apiKey') ?? '',
  projectId: params.get('projectId') ?? '',
  messagingSenderId: params.get('messagingSenderId') ?? '',
  appId: params.get('appId') ?? '',
  authDomain: params.get('authDomain') ?? '',
  storageBucket: params.get('storageBucket') ?? '',
});

const messaging = self.firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'Wasalni';
  const options = {
    body: payload.notification?.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: payload.data ?? {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(self.clients.openWindow(url));
});
