import https from 'https';

https.get('https://cheongsotower.kr/sitemap.xml', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers['content-type']);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Content starts with:', data.substring(0, 100));
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
