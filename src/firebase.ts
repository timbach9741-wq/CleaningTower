import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import type { Messaging } from 'firebase/messaging';

// Firebase 파트너 배차 시스템 설정
const firebaseConfig = {
  apiKey: "AIzaSyDYDZkLlxLaPzs_Ha-FH7nUp8GbwVT7fLc",
  authDomain: "house-clean-hub.firebaseapp.com",
  projectId: "house-clean-hub",
  storageBucket: "house-clean-hub.firebasestorage.app",
  messagingSenderId: "210430998764",
  appId: "1:210430998764:web:753529e9627b087c094dc9",
  measurementId: "G-B7GTPZ6TQ1"
};

// 중복 초기화 방지: 이미 초기화된 앱이 있으면 재사용
const app: FirebaseApp = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApps()[0];

// Firestore & Storage 인스턴스 (싱글톤 패턴)
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _messaging: Messaging | null = null;

// 지연 초기화: 실제로 사용될 때만 인스턴스를 생성
// 왜? → Firebase SDK 트리쉐이킹 + 초기 로딩 시 불필요한 네트워크 연결 방지
export function getDb(): Firestore {
  if (!_db) {
    _db = getFirestore(app);
  }
  return _db;
}

export function getStorageInstance(): FirebaseStorage {
  if (!_storage) {
    _storage = getStorage(app);
  }
  return _storage;
}

export async function getMessagingInstance(): Promise<Messaging | null> {
  if (!_messaging) {
    const supported = await isSupported();
    if (supported) {
      // ★ Service Worker를 명시적으로 등록하여 FCM이 올바른 SW를 사용하도록 설정
      // 이렇게 해야 백그라운드 알림 수신이 정상적으로 작동합니다.
      try {
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        }
      } catch (e) {
        console.warn('[Firebase] Service Worker 등록 실패:', e);
      }
      _messaging = getMessaging(app);
    }
  }
  return _messaging;
}

// 기존 코드와의 호환성을 위해 즉시 초기화된 export도 유지
// 점진적으로 getDb(), getStorageInstance()로 마이그레이션 권장
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
