import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';

// Firebase 설정 (기존 테스트 설정 재사용)
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

async function runCalendarTest() {
  console.log("🚀 [청소타워 캘린더 연동] 실시간 검증 테스트를 시작합니다...");
  let tempPartnerId = null;

  try {
    // 1. 테스트용 임시 파트너 생성 (초기 가능일은 빈 배열)
    console.log("\n1️⃣ [임시 파트너 생성 중]...");
    const partnerRef = await addDoc(collection(db, 'partners'), {
      businessType: 'business',
      companyName: '달력 테스트 업체',
      managerName: '캘린더맨',
      phone: '010-0000-0000',
      region: '서울 강남구',
      loginId: 'cal_test_123',
      status: 'active',
      availableDates: [], // 초기값 빈 배열
      createdAt: new Date().toISOString()
    });

    tempPartnerId = partnerRef.id;
    console.log(`✅ 임시 파트너 생성 성공! (ID: ${tempPartnerId})`);

    // 2. 청소 가능일 추가 시뮬레이션
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const testDates = [todayStr, tomorrowStr];
    console.log(`\n2️⃣ [청소 가능일 등록 시도]: ${testDates.join(', ')}`);
    
    // updateDoc을 이용해 availableDates 업데이트
    await updateDoc(doc(db, 'partners', tempPartnerId), {
      availableDates: testDates
    });
    console.log("➡️ Firestore 업데이트 요청 완료.");

    // 3. 업데이트 결과 데이터 조회 및 검증
    console.log("\n3️⃣ [결과 검증 중]...");
    const docSnap = await getDoc(doc(db, 'partners', tempPartnerId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("📄 DB 저장된 청소 가능일:", data.availableDates);
      
      const isSuccess = data.availableDates?.length === 2 && 
                        data.availableDates.includes(todayStr) && 
                        data.availableDates.includes(tomorrowStr);
      
      if (isSuccess) {
        console.log("✨ [검증 성공] 파트너가 설정한 가능일이 Firestore에 완벽히 기록되었습니다!");
      } else {
        throw new Error("검증 실패: 저장된 데이터가 예상과 다릅니다.");
      }
    } else {
      throw new Error("검증 실패: 파트너 문서를 다시 조회할 수 없습니다.");
    }

    // 4. 특정 날짜 토글 해제 시뮬레이션 (오늘 날짜 제거)
    const toggleOffDates = [tomorrowStr];
    console.log(`\n4️⃣ [청소 가능일 토글 해제 시도] (오늘 날짜 제거): ${tomorrowStr}만 남김`);
    await updateDoc(doc(db, 'partners', tempPartnerId), {
      availableDates: toggleOffDates
    });

    const docSnap2 = await getDoc(doc(db, 'partners', tempPartnerId));
    const data2 = docSnap2.data();
    console.log("📄 DB 저장된 청소 가능일 (토글 후):", data2?.availableDates);
    
    if (data2?.availableDates?.length === 1 && !data2.availableDates.includes(todayStr)) {
      console.log("✨ [토글 검증 성공] 날짜 해제(토글)가 완벽히 오동작 없이 작동합니다!");
    } else {
      throw new Error("토글 검증 실패: 날짜 해제가 정상 처리되지 않았습니다.");
    }

  } catch (error) {
    console.error("\n❌ [테스트 실패] 에러 발생:", error instanceof Error ? error.message : error);
  } finally {
    // 5. 테스트용 임시 파트너 리소스 삭제 (Cleanup)
    if (tempPartnerId) {
      console.log("\n5️⃣ [테스트 리소스 정리] 임시 파트너 삭제 중...");
      try {
        await deleteDoc(doc(db, 'partners', tempPartnerId));
        console.log("🧹 정리 완료: 임시 테스트 파트너가 정상 삭제되었습니다.");
      } catch (cleanErr) {
        console.error("⚠️ 리소스 정리 중 실패:", cleanErr);
      }
    }
    console.log("\n🏁 테스트 프로세스가 종료되었습니다.");
    process.exit(0);
  }
}

runCalendarTest();
