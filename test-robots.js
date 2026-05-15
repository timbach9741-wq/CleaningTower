import https from 'https';

https.get('https://cheongsotower.kr/robots.txt', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers['content-type']);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Content:\n', data);
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
