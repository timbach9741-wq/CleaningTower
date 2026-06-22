// ★ 통합 서비스 워커: PWA 설치 조건 충족 + Firebase Cloud Messaging (FCM)
// 왜 심플하게: 복잡한 캐싱 로직은 SPA에서 빈 화면을 유발할 수 있음
// 핵심 원칙: "네트워크 우선, 오프라인 시에만 캐시"

// ─── Firebase SDK (compat 버전: 서비스 워커 환경에서만 사용 가능) ───
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

// ─── PWA: 설치 + 캐시 관리 ───
const CACHE_NAME = 'cleanpartners-v9';

// ★ 설치: 즉시 활성화 (무거운 캐싱 작업 없음)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// ★ 활성화: 이전 버전 캐시만 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ★ Fetch: 네트워크 우선, 절대 페이지 로드를 방해하지 않음
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Firebase/API 요청은 절대 가로채지 않음 (서비스 워커가 건드리면 안 되는 영역)
  if (request.url.includes('firestore.googleapis.com') ||
      request.url.includes('fcm.googleapis.com') ||
      request.url.includes('identitytoolkit.googleapis.com') ||
      request.url.includes('googleapis.com') ||
      request.url.includes('gstatic.com')) {
    return;
  }

  // HTML 네비게이션 요청 (SPA 라우팅)
  // /partner-dashboard 등 직접 접근 시 항상 네트워크에서 index.html을 가져옴
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        // 오프라인일 때만 캐시된 index.html 반환
        return caches.match('/index.html') || new Response('오프라인 상태입니다. 네트워크 연결을 확인해주세요.', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      })
    );
    return;
  }

  // 그 외 요청: 그냥 네트워크로 통과 (PWA 설치 조건을 위한 최소한의 fetch 핸들러)
  event.respondWith(fetch(request));
});

// ─── FCM: 백그라운드 푸시 알림 수신 ───
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] 백그라운드 메시지 수신:', payload);

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

// ─── 알림 클릭: 파트너 대시보드로 이동 ───
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
