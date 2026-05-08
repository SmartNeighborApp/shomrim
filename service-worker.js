// service-worker.js — שומרים
const CACHE_NAME = 'shomrim-v1';

// התקנה
self.addEventListener('install', event => {
  self.skipWaiting();
});

// הפעלה
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// קבלת התראת Push
self.addEventListener('push', event => {
  let data = { title: '🛡️ שומרים', body: 'יש קריאת עזרה חדשה!', urgency: 'high' };
  try {
    data = event.data.json();
  } catch (e) {}

  const urgencyIcons = { low: '🟡', high: '🟠', critical: '🔴', pickup: '🕐' };
  const icon = urgencyIcons[data.urgency] || '🆘';

  event.waitUntil(
    self.registration.showNotification('🛡️ שומרים — ' + (data.title || 'קריאת עזרה'), {
      body: icon + ' ' + (data.body || 'ילד צריך עזרה בסביבתך'),
      icon: '/shomrim/icon-192.png',
      badge: '/shomrim/icon-192.png',
      vibrate: [300, 100, 300, 100, 300],
      requireInteraction: true,
      tag: 'sos-alert',
      data: { url: '/shomrim/parent.html' }
    })
  );
});

// לחיצה על ההתראה — פותח את האפליקציה
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('parent.html') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/shomrim/parent.html');
    })
  );
});
