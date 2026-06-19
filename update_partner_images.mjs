import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

const IMAGES = [
  '/images/partners/team_blue_uniform.webp',
  '/images/partners/couple_team_apron.webp',
  '/images/partners/female_team_green.webp',
  '/images/partners/male_steam_expert.webp',
  '/images/partners/experienced_leader.webp',
  '/images/partners/mixed_team_white.webp',
  '/images/partners/female_eco_expert.webp',
  '/images/partners/young_duo_brothers.webp',
  '/images/partners/young_couple_team.webp',
  '/images/partners/premium_team_black.webp',
  '/images/partners/female_duo_cheerful.webp',
  '/images/partners/team_karcher_equip.webp',
  '/images/partners/large_team_photo.webp',
  '/images/partners/female_leader_pro.webp',
  '/images/partners/team_orange_vest.webp',
  '/images/partners/couple_mature_expert.webp',
  '/images/partners/young_female_solo.webp',
  '/images/partners/team_red_uniform.webp',
  '/images/partners/male_solo_trusted.webp',
  '/images/partners/team_gray_modern.webp',
  '/images/partners/couple_young_casual.webp',
  '/images/partners/team_professional_van.webp',
];

async function updatePartnerImages() {
  try {
    console.log('Firestore 파트너 이미지 업데이트 시작...');
    const querySnapshot = await getDocs(collection(db, 'partners'));
    console.log(`총 ${querySnapshot.size}개의 파트너를 찾았습니다.`);

    let index = 0;
    for (const partnerDoc of querySnapshot.docs) {
      const data = partnerDoc.data();
      // 기존 이미지 중 public/images/ 아래 기본 4개의 이미지에 해당하는 경우
      // 혹은 중복 이미지가 많이 나타나는 경우 새롭게 분배
      const currentImage = data.image || '';
      
      // 무조건 22개의 유니크한 이미지 풀에서 순차적 혹은 무작위로 재배정하여 겹치지 않게 합니다.
      const newImage = IMAGES[index % IMAGES.length];
      
      console.log(`[업데이트] 파트너: ${data.companyName || data.name || data.managerName} | 이전 이미지: ${currentImage} -> 새 이미지: ${newImage}`);
      
      await updateDoc(doc(db, 'partners', partnerDoc.id), {
        image: newImage
      });
      
      index++;
    }
    
    console.log('모든 파트너 이미지 겹침 방지 업데이트가 완료되었습니다!');
    process.exit(0);
  } catch (error) {
    console.error('업데이트 진행 중 에러 발생:', error);
    process.exit(1);
  }
}

updatePartnerImages();
