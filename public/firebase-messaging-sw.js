importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Firebase 파트너 배차 시스템 설정
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

// ★ 백그라운드 메시지 수신 핸들러
// 파트너가 브라우저를 사용하지 않는 동안(백그라운드)에도 알림을 표시합니다.
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신:', payload);
  
  const notificationTitle = payload.notification?.title || '새로운 오더 알림';
  const notificationOptions = {
    body: payload.notification?.body || '지금 확인하고 오더를 수락하세요!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    // ★ 알림 클릭 시 파트너 대시보드로 이동
    data: {
      url: '/partner-dashboard'
    },
    // 알림이 자동으로 사라지지 않도록 설정
    requireInteraction: true,
    // 진동 패턴 (모바일 기기)
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ★ 알림 클릭 이벤트: 파트너 대시보드로 이동
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] 알림 클릭:', event);
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/partner-dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // 이미 열려있는 탭이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes('partner-dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      // 열려있는 탭이 없으면 새 창으로 열기
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
