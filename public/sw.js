const CACHE_NAME = 'cleanpartners-v2'; // 버전 번호 업데이트

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 이전 캐시 모두 삭제하여 강제 새로고침 효과
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] 기존 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // PWA 설치 조건을 충족하기 위한 빈 fetch 핸들러
  // 네트워크 요청을 방해하지 않고 그대로 통과시킵니다.
  event.respondWith(fetch(event.request));
});
