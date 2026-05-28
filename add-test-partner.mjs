import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDYDZkLlxLaPzs_Ha-FH7nUp8GbwVT7fLc",
  authDomain: "house-clean-hub.firebaseapp.com",
  projectId: "house-clean-hub",
  storageBucket: "house-clean-hub.firebasestorage.app",
  messagingSenderId: "210430998764",
  appId: "1:210430998764:web:753529e9627b087c094dc9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const now = new Date();
const expireDate = new Date();
expireDate.setMonth(expireDate.getMonth() + 6);

async function addPartner() {
  try {
    await addDoc(collection(db, 'partners'), {
      businessType: 'business',
      companyName: '테스트청소 (신규 6개월 계약)',
      managerName: '김테스트',
      phone: '010-9999-8888',
      region: '서울 전역',
      loginId: 'testpartner12',
      loginPassword: 'password123',
      status: 'active',
      isNotificationEnabled: true,
      notificationRegions: ['서울 전역'],
      createdAt: now.toISOString(),
      contractPlan: '6개월 (무료)',
      contractStartDate: now.toISOString(),
      contractEndDate: expireDate.toISOString(),
    });
    console.log("테스트 파트너 추가 성공!");
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}

addPartner();
