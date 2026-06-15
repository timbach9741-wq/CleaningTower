const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firebase Admin SDK 초기화 (앱이 없는 경우에만)
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.setAdminTemp = functions.https.onRequest(async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.send('이메일을 입력해주세요. 예: ?email=test@test.com');
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    res.send(`✅ 성공: ${email} 계정에 관리자 권한이 완벽하게 부여되었습니다!`);
  } catch (error) {
    res.send(`❌ 실패: ${error.message}`);
  }
});
