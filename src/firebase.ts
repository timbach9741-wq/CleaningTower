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
      // ★ 별도 서비스 워커 등록을 하지 않음
      // index.html에서 이미 sw.js(통합 서비스 워커)를 등록했으므로,
      // FCM은 해당 서비스 워커를 자동으로 사용합니다.
      // 기존에 firebase-messaging-sw.js를 여기서 별도 등록하면
      // sw.js와 scope 충돌이 발생하여 FCM 토큰 발급이 실패했음.
      _messaging = getMessaging(app);
    }
  }
  return _messaging;
}

import { getAuth } from 'firebase/auth';

// 기존 코드와의 호환성을 위해 즉시 초기화된 export도 유지
// 점진적으로 getDb(), getStorageInstance()로 마이그레이션 권장
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
