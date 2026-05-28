/**
 * 텔레그램 알림 발송 서비스
 */
export const sendTelegramAlert = async (message: string): Promise<boolean> => {
    try {
        const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
        const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
        
        if (!token || !chatId) {
            console.warn('⚠️ 텔레그램 봇 토큰(VITE_TELEGRAM_BOT_TOKEN) 또는 대화방 ID(VITE_TELEGRAM_CHAT_ID)가 환경 변수에 설정되어 있지 않습니다.');
            return false;
        }

        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error('❌ 텔레그램 알림 전송 실패:', response.statusText, errData);
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ 텔레그램 알림 전송 중 에러 발생:', error);
        return false;
    }
};
