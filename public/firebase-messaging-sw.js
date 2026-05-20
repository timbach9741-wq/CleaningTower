// ★ 이 파일은 더 이상 직접 사용되지 않습니다.
// FCM SDK가 기본적으로 이 파일명을 찾기 때문에 유지하되,
// 실제 로직은 sw.js(통합 서비스 워커)에서 처리합니다.
// firebase.ts에서 sw.js를 명시적으로 등록하므로 이 파일은 폴백용입니다.

importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDYDZkLlxLaPzs_Ha-FH7nUp8GbwVT7fLc",
  authDomain: "house-clean-hub.firebaseapp.com",
  projectId: "house-clean-hub",
  storageBucket: "house-clean-hub.firebasestorage.app",
  messagingSenderId: "210430998764",
  appId: "1:210430998764:web:753529e9627b087c094dc9",
  measurementId: "G-B7GTPZ6TQ1"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신:', payload);
  const notificationTitle = payload.notification?.title || '새로운 오더 알림';
  const notificationOptions = {
    body: payload.notification?.body || '지금 확인하고 오더를 수락하세요!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: { url: '/partner-dashboard' },
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/partner-dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes('partner-dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
