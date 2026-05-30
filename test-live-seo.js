import https from 'https';

https.get('https://cheongsotower.kr/service', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const canonicalMatch = data.match(/<link rel="canonical" href="([^"]+)"/);
    const titleMatch = data.match(/<title>([^<]+)<\/title>/);
    const descriptionMatch = data.match(/<meta name="description" content="([^"]+)"/);
    const ogUrlMatch = data.match(/<meta property="og:url" content="([^"]+)"/);
    const ogTitleMatch = data.match(/<meta property="og:title" content="([^"]+)"/);
    
    console.log('--- LIVE SITE VERIFICATION (service page) ---');
    console.log('Canonical URL:', canonicalMatch ? canonicalMatch[1] : 'NOT FOUND');
    console.log('Page Title   :', titleMatch ? titleMatch[1] : 'NOT FOUND');
    console.log('Description  :', descriptionMatch ? descriptionMatch[1] : 'NOT FOUND');
    console.log('og:url       :', ogUrlMatch ? ogUrlMatch[1] : 'NOT FOUND');
    console.log('og:title     :', ogTitleMatch ? ogTitleMatch[1] : 'NOT FOUND');
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
