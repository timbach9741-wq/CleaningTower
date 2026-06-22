import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDYDZkLlxLaPzs_Ha-FH7nUp8GbwVT7fLc",
  authDomain: "house-clean-hub.firebaseapp.com",
  projectId: "house-clean-hub",
  storageBucket: "house-clean-hub.firebasestorage.app",
  messagingSenderId: "210430998764",
  appId: "1:210430998764:web:753529e9627b087c094dc9",
  measurementId: "G-B7GTPZ6TQ1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  console.log('--- Querying partners collection ---');
  try {
    const qPartners = query(collection(db, 'partners'), orderBy('createdAt', 'desc'), limit(10));
    const snapshot = await getDocs(qPartners);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`[Partner] ID: ${doc.id}, Name: ${data.name || data.managerName || data.companyName}, Phone: ${data.phone}, IsB2B: ${data.isB2B}, CreatedAt: ${data.createdAt}, Status: ${data.status}`);
    });
  } catch (err) {
    console.error('Error querying partners:', err);
  }

  console.log('--- Querying b2bAccounts collection ---');
  try {
    const qB2b = query(collection(db, 'b2bAccounts'), orderBy('createdAt', 'desc'), limit(10));
    const snapshot = await getDocs(qB2b);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`[B2BAccount] ID: ${doc.id}, BusinessName: ${data.businessName}, Phone: ${data.phone}, CreatedAt: ${data.createdAt}`);
    });
  } catch (err) {
    console.error('Error querying b2bAccounts:', err);
  }
}

check();
