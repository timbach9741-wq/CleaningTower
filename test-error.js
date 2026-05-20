import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, 'dist');

const server = createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  let filePath = join(DIST_DIR, urlPath);
  try {
    const content = readFileSync(filePath);
    const ext = urlPath.split('.').pop();
    const mimeTypes = {
      'html': 'text/html', 'js': 'application/javascript', 'css': 'text/css'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
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

server.listen(4174, async () => {
  console.log('Server running on 4174');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  // Visit index first to set localStorage
  await page.goto('http://localhost:4174/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('partnerId', 'mock_partner_id_for_testing');
  });

  // Now navigate to the dashboard
  await page.goto('http://localhost:4174/partner-dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot-loggedin.png' });
  console.log('Screenshot taken!');
  
  await browser.close();
  server.close();
});
