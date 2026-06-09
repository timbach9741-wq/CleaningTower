import puppeteer from 'puppeteer';

async function main() {
  console.log('Starting Puppeteer for quote screenshots...');
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812 });

  // 1. Consumer quote (dark theme)
  console.log('Navigating to http://localhost:5173/quote/move-in...');
  await page.goto('http://localhost:5173/quote/move-in', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot-quote-dark.png', fullPage: true });
  console.log('Screenshot taken: screenshot-quote-dark.png');

  // 2. B2B quote (light theme)
  console.log('Navigating to http://localhost:5173/b2b/quote...');
  await page.goto('http://localhost:5173/b2b/quote', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot-quote-light.png', fullPage: true });
  console.log('Screenshot taken: screenshot-quote-light.png');

  await browser.close();
  console.log('Done.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
