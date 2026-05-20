// ★ 통합 서비스 워커: PWA + Firebase Cloud Messaging (FCM)
// 왜 통합했나: sw.js와 firebase-messaging-sw.js 두 개가 같은 scope('/')에서
// 경쟁하면 FCM 토큰 발급이 실패하고, 푸시 알림이 수신되지 않음.
// 하나의 서비스 워커가 PWA 캐싱과 FCM 백그라운드 메시지를 모두 처리해야 합니다.

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

// ─── PWA: 캐시 관리 ───
const CACHE_NAME = 'cleanpartners-v3';
// 앱 셸(App Shell): 오프라인에서도 최소한의 화면을 보여주기 위한 핵심 파일
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// ★ 설치: 앱 셸을 캐시에 저장
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  // 대기 상태 건너뛰고 즉시 활성화
  self.skipWaiting();
});

// ★ 활성화: 이전 버전 캐시 정리
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

// ★ Fetch: Network-First 전략 + SPA 폴백
// 왜 Network-First: 항상 최신 데이터를 보여주되, 오프라인일 때만 캐시 사용
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // API 요청이나 Firebase 요청은 항상 네트워크로
  if (request.url.includes('firestore.googleapis.com') ||
      request.url.includes('fcm.googleapis.com') ||
      request.url.includes('identitytoolkit.googleapis.com')) {
    return;
  }

  // HTML 네비게이션 요청 (SPA 라우팅): /partner-dashboard 등 직접 접근 시 index.html 반환
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // 정적 리소스: 네트워크 우선, 실패 시 캐시
  event.respondWith(
    fetch(request).then((response) => {
      // 성공한 응답은 캐시에도 저장 (다음 오프라인 접근 대비)
      if (response.ok && request.method === 'GET') {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
      }
      return response;
    }).catch(() => {
      return caches.match(request);
    })
  );
});

// ─── FCM: 백그라운드 푸시 알림 수신 ───
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] 백그라운드 메시지 수신:', payload);

  const notificationTitle = payload.notification?.title || '새로운 오더 알림';
  const notificationOptions = {
    body: payload.notification?.body || '지금 확인하고 오더를 수락하세요!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
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

// ─── 알림 클릭: 파트너 대시보드로 이동 ───
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] 알림 클릭:', event);
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
