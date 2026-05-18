/**
 * 프리렌더링 스크립트
 * 
 * 목적: 네이버 검색 봇은 JavaScript를 실행하지 못하므로,
 * 빌드된 SPA를 Puppeteer로 방문하여 완성된 HTML을 정적 파일로 저장합니다.
 * 이렇게 하면 네이버봇이 콘텐츠를 읽을 수 있어 검색 노출이 가능해집니다.
 * 
 * 사용법: npm run build 후 npm run prerender 실행
 */

import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, 'dist');

// 프리렌더링할 공개 페이지 목록
// (관리자/대시보드/동적 파라미터 페이지는 SEO 불필요하므로 제외)
const ROUTES_TO_PRERENDER = [
  '/',
  '/service',
  '/partners',
  '/partners/join',
  '/cleaning/move-in',
  '/cleaning/sick-building',
  '/cleaning/appliance',
  '/cleaning/regular',
];

/**
 * 간단한 정적 파일 서버
 * dist 폴더를 로컬에서 서빙하여 Puppeteer가 접근할 수 있도록 함
 */
function createStaticServer(port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      // URL에서 쿼리 파라미터 제거
      let urlPath = req.url.split('?')[0];
      
      // 파일 확장자가 없으면 SPA fallback → index.html 제공
      let filePath = join(DIST_DIR, urlPath);
      
      // 실제 파일이 존재하는지 확인
      try {
        const content = readFileSync(filePath);
        // MIME 타입 결정
        const ext = urlPath.split('.').pop();
        const mimeTypes = {
          'html': 'text/html',
          'js': 'application/javascript',
          'css': 'text/css',
          'svg': 'image/svg+xml',
          'webp': 'image/webp',
          'json': 'application/json',
          'xml': 'application/xml',
          'txt': 'text/plain',
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(content);
      } catch {
        // 파일이 없으면 index.html로 폴백 (SPA 라우팅)
        try {
          const indexContent = readFileSync(join(DIST_DIR, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexContent);
        } catch {
          res.writeHead(404);
          res.end('Not Found');
        }
      }
    });

    server.listen(port, () => {
      console.log(`📡 정적 서버 시작: http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function prerender() {
  const PORT = 4173;
  
  console.log('🚀 프리렌더링 시작...\n');
  
  // 1단계: dist 폴더가 있는지 확인
  if (!existsSync(DIST_DIR)) {
    console.error('❌ dist 폴더가 없습니다. 먼저 "npm run build"를 실행하세요.');
    process.exit(1);
  }

  // 2단계: 정적 서버 시작
  const server = await createStaticServer(PORT);

  // 3단계: Puppeteer 브라우저 실행
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const route of ROUTES_TO_PRERENDER) {
      try {
        const page = await browser.newPage();
        const url = `http://localhost:${PORT}${route}`;
        
        console.log(`  📄 렌더링 중: ${route}`);
        
        // 페이지 방문 & 대기
        // networkidle2 사용: Firebase WebSocket 연결이 유지되므로
        // networkidle0(연결 0개)는 절대 도달할 수 없음
        // networkidle2는 동시 연결이 2개 이하면 완료로 판단
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 45000,
        });

        // React가 렌더링을 완료할 시간을 추가로 대기
        await page.waitForSelector('#root > *', { timeout: 15000 });
        // 비동기 데이터 로딩/애니메이션 안정화 대기
        await new Promise(r => setTimeout(r, 2000));

        // 렌더링된 HTML 추출
        let html = await page.content();
        
        // 저장 경로 결정
        let outputPath;
        if (route === '/') {
          outputPath = join(DIST_DIR, 'index.html');
        } else {
          // /partners → /partners/index.html
          const dir = join(DIST_DIR, route);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          outputPath = join(dir, 'index.html');
        }

        writeFileSync(outputPath, html, 'utf-8');
        console.log(`  ✅ 저장 완료: ${outputPath.replace(DIST_DIR, 'dist')}`);
        
        await page.close();
      } catch (err) {
        // 개별 페이지 실패 시에도 나머지 페이지는 계속 처리
        console.warn(`  ⚠️ ${route} 렌더링 실패 (건너뜀): ${err.message}`);
      }
    }

    console.log(`\n🎉 프리렌더링 완료! ${ROUTES_TO_PRERENDER.length}개 페이지가 정적 HTML로 변환되었습니다.`);
    console.log('   네이버봇이 이제 콘텐츠를 읽을 수 있습니다.\n');

  } catch (error) {
    console.error('❌ 프리렌더링 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
}

prerender();
