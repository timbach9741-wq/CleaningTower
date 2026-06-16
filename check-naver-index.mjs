/**
 * 네이버 검색 노출 모니터링 스크립트
 * cheongsotower.kr 사이트의 SEO 상태를 종합 점검합니다.
 */
import https from 'https';

const SITE = 'https://cheongsotower.kr';

const CORE_PAGES = [
  '/',
  '/service/',
  '/partners/',
  '/partners/join/',
  '/cleaning/move-in/',
  '/cleaning/sick-building/',
  '/cleaning/appliance/',
  '/cleaning/regular/',
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('  청소타워 네이버 검색 노출 모니터링');
  console.log('  실행 시각:', new Date().toLocaleString('ko-KR'));
  console.log('='.repeat(60));

  // 1. robots.txt 확인
  console.log('\n📋 1. robots.txt 확인');
  try {
    const r = await fetch(`${SITE}/robots.txt`);
    console.log(`   상태: ${r.status === 200 ? '✅ 정상' : '❌ 오류'} (${r.status})`);
    console.log(`   내용:\n${r.body.split('\n').map(l => '   ' + l).join('\n')}`);
  } catch (e) {
    console.log(`   ❌ 접근 실패: ${e.message}`);
  }

  // 2. sitemap.xml 확인
  console.log('\n📋 2. sitemap.xml 확인');
  try {
    const r = await fetch(`${SITE}/sitemap.xml`);
    console.log(`   상태: ${r.status === 200 ? '✅ 정상' : '❌ 오류'} (${r.status})`);
    console.log(`   Content-Type: ${r.headers['content-type']}`);
    const urlCount = (r.body.match(/<loc>/g) || []).length;
    console.log(`   등록된 URL 수: ${urlCount}개`);
  } catch (e) {
    console.log(`   ❌ 접근 실패: ${e.message}`);
  }

  // 3. 네이버 인증 파일 확인
  console.log('\n📋 3. 네이버 사이트 인증 파일 확인');
  const verifyFiles = [
    '/naver22c0b7ebc99668722bf81b88034713c8.html',
    '/naver85eea957decbb5fb8a570e18af012678dbba5017.html'
  ];
  for (const f of verifyFiles) {
    try {
      const r = await fetch(`${SITE}${f}`);
      const basename = f.split('/').pop();
      console.log(`   ${basename}: ${r.status === 200 ? '✅ 정상' : '❌ 오류'} (${r.status})`);
    } catch (e) {
      console.log(`   ❌ ${f}: ${e.message}`);
    }
  }

  // 4. 주요 페이지 프리렌더링 상태 확인 (SSR HTML에 콘텐츠가 있는지)
  console.log('\n📋 4. 주요 페이지 프리렌더링(SSR) 상태 확인');
  for (const path of CORE_PAGES) {
    try {
      const r = await fetch(`${SITE}${path}`);
      const hasContent = r.body.includes('청소타워') && r.body.length > 5000;
      const hasMetaDesc = r.body.includes('meta name="description"');
      const hasCanonical = r.body.includes('rel="canonical"');
      const hasOG = r.body.includes('og:title');
      
      const checks = [
        hasContent ? '콘텐츠✅' : '콘텐츠❌',
        hasMetaDesc ? 'description✅' : 'description❌',
        hasCanonical ? 'canonical✅' : 'canonical❌',
        hasOG ? 'OG✅' : 'OG❌',
      ];
      
      console.log(`   ${path.padEnd(25)} [${r.status}] ${checks.join(' | ')}`);
    } catch (e) {
      console.log(`   ${path.padEnd(25)} ❌ 접근 실패: ${e.message}`);
    }
  }

  // 5. 네이버 실제 색인 확인 (site: 검색)
  console.log('\n📋 5. 네이버 검색 색인 확인 (site:cheongsotower.kr)');
  try {
    const r = await fetch('https://search.naver.com/search.naver?query=site%3Acheongsotower.kr');
    const hasResults = !r.body.includes('검색결과가 없습니다') && !r.body.includes('일치하는 검색결과가 없습니다');
    console.log(`   네이버 색인 상태: ${hasResults ? '✅ 색인됨 (검색 결과 존재)' : '⚠️ 아직 미색인 또는 확인 필요'}`);
  } catch (e) {
    console.log(`   ⚠️ 네이버 검색 확인 실패: ${e.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  모니터링 완료');
  console.log('='.repeat(60));
}

main().catch(console.error);
