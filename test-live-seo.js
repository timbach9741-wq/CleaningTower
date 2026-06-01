import https from 'https';

const ROUTES = [
  '/',
  '/service',
  '/partners',
  '/partners/join',
  '/cleaning/move-in',
  '/cleaning/sick-building',
  '/cleaning/appliance',
  '/cleaning/regular'
];

async function checkRoute(route) {
  return new Promise((resolve) => {
    https.get(`https://cheongsotower.kr${route}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const canonicalMatch = data.match(/<link rel="canonical" href="([^"]+)"/);
        const titleMatch = data.match(/<title>([^<]+)<\/title>/);
        const descriptionMatch = data.match(/<meta name="description" content="([^"]+)"/);
        const ogUrlMatch = data.match(/<meta property="og:url" content="([^"]+)"/);
        const ogTitleMatch = data.match(/<meta property="og:title" content="([^"]+)"/);
        const naverMatch = data.match(/<meta name="naver-site-verification" content="([^"]+)"/);
        const googleMatch = data.match(/<meta name="google-site-verification" content="([^"]+)"/);

        console.log(`\n📌 Path: ${route}`);
        console.log(`   Status Code: ${res.statusCode}`);
        console.log(`   Title      : ${titleMatch ? titleMatch[1] : '❌ NOT FOUND'}`);
        console.log(`   Description: ${descriptionMatch ? descriptionMatch[1].slice(0, 70) + '...' : '❌ NOT FOUND'}`);
        console.log(`   Canonical  : ${canonicalMatch ? canonicalMatch[1] : '❌ NOT FOUND'}`);
        console.log(`   og:url     : ${ogUrlMatch ? ogUrlMatch[1] : '❌ NOT FOUND'}`);
        if (route === '/') {
          console.log(`   Naver Verif: ${naverMatch ? '✅ MATCHED (' + naverMatch[1] + ')' : '❌ NOT FOUND'}`);
          console.log(`   Google Ver : ${googleMatch ? '✅ MATCHED (' + googleMatch[1] + ')' : '❌ NOT FOUND'}`);
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`📌 Path: ${route} -> ❌ Error: ${err.message}`);
      resolve();
    });
  });
}

async function runAll() {
  console.log('=== STARTING COMPREHENSIVE LIVE SEO AUDIT ===');
  for (const route of ROUTES) {
    await checkRoute(route);
  }
  console.log('\n=== LIVE SEO AUDIT COMPLETED ===');
}

runAll();
