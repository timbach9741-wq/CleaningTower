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

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || '새로운 오더 알림';
  const notificationOptions = {
    body: payload.notification?.body || '지금 확인하고 오더를 수락하세요!',
    icon: '/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
