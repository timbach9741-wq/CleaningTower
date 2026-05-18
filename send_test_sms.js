import fs from 'fs';
import path from 'path';
import { SolapiMessageService } from 'solapi';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
const envPath = path.join(__dirname, '../데일리하우징 홈페이지/.env');
const envFile = fs.readFileSync(envPath, 'utf8');

const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.replace(/\\n/gm, '\n');
    }
    value = value.replace(/(^['"]|['"]$)/g, '').trim();
    env[key] = value;
  }
});

const solapiApiKey = env['SOLAPI_API_KEY'];
const solapiApiSecret = env['SOLAPI_API_SECRET'];
const solapiSenderNumber = env['SOLAPI_SENDER_NUMBER'];

if (!solapiApiKey || !solapiApiSecret || !solapiSenderNumber) {
  console.error("Solapi credentials not found in .env");
  process.exit(1);
}

const messageService = new SolapiMessageService(solapiApiKey, solapiApiSecret);
const targetPhone = '01075905500';
const messageText = `청소타워 파트너 가입 및 알림 앱 설치 링크입니다. 원활한 앱 설치를 위해 아래 링크를 클릭하시거나 복사하여 크롬(Chrome) 브라우저 인터넷 창에 붙여넣어 열어주세요.

👉 https://house-clean-hub.web.app/partner`;

async function send() {
  try {
    const response = await messageService.send({
      to: targetPhone,
      from: solapiSenderNumber,
      text: messageText,
      autoTypeDetect: true
    });
    console.log(`[전송 성공] 대상: ${targetPhone} - 메시지 ID: ${response.messageId}`);
  } catch (error) {
    console.error(`[전송 실패] 사유: ${error.message}`);
  }
}

send();
