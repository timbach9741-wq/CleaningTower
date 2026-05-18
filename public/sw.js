const CACHE_NAME = 'cleanpartners-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 간단한 PWA 설치 조건을 충족하기 위한 빈 fetch 핸들러
  // 네트워크 요청을 방해하지 않고 그대로 통과시킵니다.
  event.respondWith(fetch(event.request));
});
