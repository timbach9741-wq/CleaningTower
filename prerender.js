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

const PSEO_SLUGS = [
  "seoul-gangnam", "seoul-seocho", "seoul-songpa", "seoul-mapo", "seoul-yongsan",
  "seoul-seongdong", "seoul-gangdong", "seoul-nowon", "seoul-yeongdeungpo",
  "gyeonggi-bundang", "gyeonggi-suwon", "gyeonggi-ilsan", "gyeonggi-gimpo",
  "gyeonggi-hwaseong", "gyeonggi-yongin", "gyeonggi-hanami", "gyeonggi-namyangju",
  "gyeonggi-anyang", "gyeonggi-bucheon", "gyeonggi-gwangmyeong",
  "incheon-yeonsu", "incheon-bupyeong",
  "busan-haeundae", "busan-suyeong", "busan-dongnae",
  "daegu-suseong", "daejeon-yuseong"
];

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
  ...PSEO_SLUGS.map(slug => `/${slug}`)
];

// 각 라우트별 검색엔진 메타 정보 설정 (네이버/구글 등 검색봇 노출 최적화용)
const ROUTE_META = {
  '/': {
    title: '청소타워 | 청결의 깊이가 다른 프리미엄 입주/이사 청소',
    description: '고객과 검증된 청소 전문가를 연결하는 프리미엄 입주/이사 청소 플랫폼, 청소타워입니다. 합리적인 가격과 확실한 A/S로 완벽한 청결을 약속드립니다.',
    keywords: '청소타워, 입주청소, 이사청소, 거주청소, 사무실청소, 청소업체, 청소전문가, 프리미엄청소'
  },
  '/service': {
    title: '서비스 안내 | 청소타워',
    description: '입주청소, 이사청소, 거주청소, 상가/사무실 청소 등 청소타워의 체계적인 6단계 프리미엄 클리닝 서비스 범위와 무상 A/S 정책을 안내합니다.',
    keywords: '청소타워 서비스, 입주청소 범위, 이사청소 범위, 거주청소 서비스, 청소타워 A/S'
  },
  '/partners': {
    title: '청소 전문가 찾기 | 청소타워 파트너스',
    description: '내 지역의 평점 높은 청소 전문가를 확인하고 비교해 보세요. 본사 직영팀 및 엄격히 검증된 전문가들이 최적의 맞춤 서비스를 제공합니다.',
    keywords: '청소 전문가, 청소업체 추천, 청소타워 파트너스, 입주청소 업체 비교'
  },
  '/partners/join': {
    title: '파트너스 지원하기 | 청소타워',
    description: '청소타워와 함께 성장할 전문 청소 파트너사를 모집합니다. 광고비 부담 없이 오더를 매칭받고 안정적인 수익을 창출해 보세요.',
    keywords: '청소 파트너 모집, 청소업체 창업, 청소타워 입점, 청소 오더 매칭'
  },
  '/cleaning/move-in': {
    title: '프리미엄 입주청소 | 청소타워',
    description: '신축 아파트, 빌라, 오피스텔 공사 후 미세분진과 새집증후군 유해물질을 완벽하게 제거하는 청소타워의 프리미엄 입주청소 서비스입니다.',
    keywords: '입주청소, 신축입주청소, 아파트입주청소, 새집증후군 제거, 분진제거'
  },
  '/cleaning/sick-building': {
    title: '새집증후군 케어 | 청소타워',
    description: '신축 건물의 유해 물질, 포름알데히드, 휘발성 유기화합물을 친환경 베이크아웃과 전문 장비로 안전하게 제거하여 가족의 건강을 지킵니다.',
    keywords: '새집증후군, 베이크아웃, 포름알데히드 제거, 새집증후군 제거업체'
  },
  '/cleaning/appliance': {
    title: '가전 분해 청소 | 청소타워',
    description: '에어컨, 세탁기, 냉장고 등 가전제품을 완전 분해하여 내부의 곰팡이, 먼지, 세균을 고압 세척 및 살균 처리하는 가전 케어 서비스입니다.',
    keywords: '가전분해청소, 에어컨 청소, 세탁기 분해청소, 냉장고 청소'
  },
  '/cleaning/regular': {
    title: '정기 청소 서비스 | 청소타워',
    description: '사무실, 병원, 상가 등 정기적인 관리가 필요한 상업 공간을 쾌적하고 위생적으로 유지해 드리는 맞춤형 정기 관리 서비스입니다.',
    keywords: '정기청소, 사무실정기청소, 상가정기청소, 병원청소, 정기 관리 서비스'
  }
};


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

  const CONCURRENCY_LIMIT = 4;
  const queue = [...ROUTES_TO_PRERENDER];
  let processedCount = 0;

  try {
    const worker = async () => {
      while (queue.length > 0) {
        const route = queue.shift();
        if (!route) continue;
        
        try {
          const page = await browser.newPage();
          const url = `http://localhost:${PORT}${route}`;
          processedCount++;
          
          console.log(`  📄 렌더링 중 (${processedCount}/${ROUTES_TO_PRERENDER.length}): ${route}`);
          
          // 페이지 방문 & 대기
          await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 45000,
          });
  
          // React가 렌더링을 완료할 시간을 추가로 대기
          await page.waitForSelector('#root > *', { timeout: 15000 });
          // 비동기 데이터 로딩/애니메이션 안정화 대기 단축
          await new Promise(r => setTimeout(r, 300));
  
          // 메타 정보 조회 또는 동적 생성 (pSEO용)
          let metaInfo = ROUTE_META[route];
          if (!metaInfo && route.startsWith('/')) {
            const slug = route.substring(1);
            const parts = slug.split('-');
            if (parts.length >= 2) {
              const SIDO_MAP = {
                seoul: "서울", gyeonggi: "경기", incheon: "인천", busan: "부산",
                daegu: "대구", gwangju: "광주", daejeon: "대전", ulsan: "울산",
                sejong: "세종", gangwon: "강원", chungbuk: "충북", chungnam: "충남",
                jeonbuk: "전북", jeonnam: "전남", gyeongbuk: "경북", gyeongnam: "경남", jeju: "제주"
              };
              const GU_MAP = {
                gangnam: "강남구", seocho: "서초구", songpa: "송파구", mapo: "마포구", yongsan: "용산구",
                seongdong: "성동구", gangdong: "강동구", nowon: "노원구", yeongdeungpo: "영등포구",
                bundang: "분당구", suwon: "수원시", ilsan: "일산동구", gimpo: "김포시",
                hwaseong: "화성시", yongin: "용인시", hanami: "하남시", namyangju: "남양주시",
                anyang: "안양시", bucheon: "부천시", gwangmyeong: "광명시",
                yeonsu: "연수구", bupyeong: "부평구", haeundae: "해운대구",
                suyeong: "수영구", dongnae: "동래구", suseong: "수성구", yuseong: "유성구"
              };
              const sido = SIDO_MAP[parts[0]] || "";
              const gu = GU_MAP[parts[1]] || parts[1];
              const fullRegion = `${sido} ${gu}`.trim();
              metaInfo = {
                title: `${fullRegion} 입주청소 이사청소 추천 가격 1위 업체 | 청소타워`,
                description: `${fullRegion} 입주청소, 이사청소 평당 정찰제 비용 가이드 및 평점 우수 청소 전문가 비교. 청소타워 100% 본사 보증 무상 A/S 정책으로 안심하고 예약하세요.`,
                keywords: `${fullRegion} 입주청소, ${fullRegion} 이사청소, ${fullRegion} 청소업체, ${fullRegion} 입주청소 가격, ${fullRegion} 이사청소 추천`
              };
            }
          }
  
          // Puppeteer에서 DOM 직접 수정 (경로별 SEO 메타 정보 동적 주입)
          await page.evaluate((currentRoute, metaInfo) => {
            if (!metaInfo) return;
            
            // 1. Title 변경
            document.title = metaInfo.title;
            
            // 2. Canonical URL 변경
            let canonical = document.querySelector('link[rel="canonical"]');
            if (!canonical) {
              canonical = document.createElement('link');
              canonical.setAttribute('rel', 'canonical');
              document.head.appendChild(canonical);
            }
            canonical.setAttribute('href', `https://cheongsotower.kr${currentRoute === '/' ? '/' : currentRoute + '/'}`);
  
            // Helper: meta 태그 업데이트 또는 생성
            const updateOrCreateMeta = (attrName, attrValue, contentValue) => {
              let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`);
              if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attrName, attrValue);
                document.head.appendChild(meta);
              }
              meta.setAttribute('content', contentValue);
            };
  
            // 3. Description 변경
            updateOrCreateMeta('name', 'description', metaInfo.description);
  
            // 4. Keywords 변경
            updateOrCreateMeta('name', 'keywords', metaInfo.keywords);
  
            // 5. Open Graph url, title, description 변경
            updateOrCreateMeta('property', 'og:url', `https://cheongsotower.kr${currentRoute === '/' ? '/' : currentRoute + '/'}`);
            updateOrCreateMeta('property', 'og:title', metaInfo.title);
            updateOrCreateMeta('property', 'og:description', metaInfo.description);
  
            // 6. Twitter url, title, description 변경
            updateOrCreateMeta('property', 'twitter:url', `https://cheongsotower.kr${currentRoute === '/' ? '/' : currentRoute + '/'}`);
            updateOrCreateMeta('property', 'twitter:title', metaInfo.title);
            updateOrCreateMeta('property', 'twitter:description', metaInfo.description);
            
          }, route, metaInfo);
  
          // 렌더링된 HTML 추출
          let html = await page.content();
          
          // 저장 경로 결정
          let outputPath;
          if (route === '/') {
            outputPath = join(DIST_DIR, 'index.html');
          } else {
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
          console.warn(`  ⚠️ ${route} 렌더링 실패 (건너뜀): ${err.message}`);
        }
      }
    };
  
    const workers = Array(Math.min(CONCURRENCY_LIMIT, ROUTES_TO_PRERENDER.length))
      .fill(null)
      .map(() => worker());
  
    await Promise.all(workers);

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
