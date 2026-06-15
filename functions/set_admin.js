const admin = require('firebase-admin');

// 로컬 환경에서도 작동하도록 프로젝트 ID 명시
admin.initializeApp({
  projectId: 'house-clean-hub'
});

async function grantAdminRole() {
  const email = 'cjdthxkdnj1@naver.com';
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // admin: true 라는 커스텀 클레임 부여
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    
    console.log(`✅ 성공적으로 ${email} 계정에 관리자 권한(admin: true)이 부여되었습니다!`);
    console.log(`새로운 권한을 인식하기 위해, 브라우저에서 로그아웃 후 다시 로그인 해주세요.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ 권한 부여 중 오류 발생:', error.message);
    process.exit(1);
  }
}

grantAdminRole();
