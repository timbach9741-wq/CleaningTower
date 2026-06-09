import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, addDoc, deleteDoc } from 'firebase/firestore';
import puppeteer from 'puppeteer';

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

async function ensureTestPartner() {
  const q = query(collection(db, 'partners'), where('loginId', '==', 'testpartner12'));
  const snapshot = await getDocs(q);
  for (const docSnap of snapshot.docs) {
    console.log('Deleting existing test partner document:', docSnap.id);
    await deleteDoc(docSnap.ref);
  }
  
  console.log('Creating clean test partner...');
  const now = new Date();
  const expireDate = new Date();
  expireDate.setMonth(expireDate.getMonth() + 6);
  
  await addDoc(collection(db, 'partners'), {
    businessType: 'business',
    companyName: '테스트청소 (신규 6개월 계약)',
    managerName: '김테스트',
    phone: '010-9999-8888',
    region: '서울 전역',
    loginId: 'testpartner12',
    loginPassword: 'password123',
    password: 'password123',
    status: 'active',
    isNotificationEnabled: true,
    notificationRegions: ['서울 전역'],
    createdAt: now.toISOString(),
    contractPlan: '6개월 (무료)',
    contractStartDate: now.toISOString(),
    contractEndDate: expireDate.toISOString(),
  });
  console.log('Test partner created successfully.');
}

async function runBrowserTest() {
  console.log('Starting Puppeteer browser test...');
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 375, height: 812 }); // iPhone X dimensions

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('dialog', async dialog => {
    console.log(`BROWSER DIALOG: [${dialog.type()}] ${dialog.message()}`);
    await dialog.dismiss();
  });

  console.log('Navigating to http://localhost:5173/partner-dashboard');
  await page.goto('http://localhost:5173/partner-dashboard', { waitUntil: 'networkidle2' });

  // Click login trigger button
  console.log('Clicking the login option button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find(b => b.textContent.includes('이미 가입하셨나요?'));
    if (target) {
      target.click();
    } else {
      console.log('Login trigger button not found (perhaps already on login page).');
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  // Enter login info
  console.log('Typing login credentials...');
  await page.type('input[type="text"]', 'testpartner12');
  await page.type('input[type="password"]', 'password123');

  // Submit form
  console.log('Submitting login form...');
  await page.click('button[type="submit"]');

  // Wait for login and dashboard to load
  console.log('Waiting for dashboard to load...');
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: 'screenshot-after-login.png' });
  console.log('Screenshot taken after login: screenshot-after-login.png');

  // Switch to Profile Tab
  console.log('Navigating to the Profile (내 정보) tab...');
  await page.evaluate(() => {
    const navButtons = Array.from(document.querySelectorAll('button, a'));
    const profileTab = navButtons.find(el => el.textContent.includes('내 정보'));
    if (profileTab) {
      profileTab.click();
    } else {
      console.error('Profile tab button not found.');
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  // Intercept window.open
  await page.evaluate(() => {
    window.open = (url) => {
      window.openedUrl = url;
      return null;
    };
  });

  // Click the Kakao Chat Inquiry button
  console.log('Clicking "본사 1:1 채팅 문의" button...');
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find(b => b.textContent.includes('본사 1:1 채팅 문의'));
    if (target) {
      target.click();
      return true;
    }
    return false;
  });

  if (!clicked) {
    console.error('Inquiry button not found.');
  }

  await new Promise(r => setTimeout(r, 500));

  // Retrieve clicked URL
  const openedUrl = await page.evaluate(() => window.openedUrl);
  console.log(`Captured opened URL: ${openedUrl}`);

  if (openedUrl === 'http://pf.kakao.com/_xnHTnX/chat') {
    console.log('✅ TEST PASSED: Link successfully updated to http://pf.kakao.com/_xnHTnX/chat');
  } else {
    console.error(`❌ TEST FAILED: Link is ${openedUrl}`);
  }

  // Take screenshot for visual confirmation
  await page.screenshot({ path: 'screenshot-kakao-test.png' });
  console.log('Screenshot taken: screenshot-kakao-test.png');

  await browser.close();
}

async function main() {
  await ensureTestPartner();
  await runBrowserTest();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
