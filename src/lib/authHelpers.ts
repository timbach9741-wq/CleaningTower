import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface SocialUser {
  id: string;
  name: string;
  email: string;
  provider: 'kakao' | 'naver';
  profileImage?: string;
}

export const saveSocialUser = async (user: SocialUser) => {
  try {
    const userRef = doc(db, 'users', user.id);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // 새 유저 생성
      await setDoc(userRef, {
        ...user,
        role: 'consumer',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    } else {
      // 기존 유저 로그인 시간 업데이트
      await setDoc(userRef, {
        name: user.name, // 카카오톡 닉네임이 바뀌었을 수 있으므로 업데이트
        profileImage: user.profileImage,
        lastLoginAt: serverTimestamp(),
      }, { merge: true });
    }
    
    // 로컬 스토리지에 세션 저장
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return true;
  } catch (error) {
    console.error('Error saving user to Firestore:', error);
    return false;
  }
};

export const getCurrentUser = (): SocialUser | null => {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
};

export const logoutUser = () => {
  localStorage.removeItem('currentUser');
};
