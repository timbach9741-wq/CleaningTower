import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function main() {
  const htmlPath = 'file:///' + path.resolve('C:/Users/PC/Desktop/청소타워_파트너_가입_QnA_답변서.html').replace(/\\/g, '/');
  console.log('Loading HTML:', htmlPath);
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  await page.goto(htmlPath, { waitUntil: 'domcontentloaded' });
  
  const pdfPath1 = 'C:/Users/PC/Desktop/청소타워_파트너_가입_QnA_답변서.pdf';
  const pdfPath2 = 'C:/Users/PC/Desktop/CheongsoTower/청소타워_파트너_가입_QnA_답변서.pdf';
  
  await page.pdf({
    path: pdfPath1,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '40px',
      bottom: '40px',
      left: '40px',
      right: '40px'
    }
  });
  
  console.log('PDF successfully generated at:', pdfPath1);
  
  // 프로젝트 폴더로도 복사본 생성
  fs.copyFileSync(pdfPath1, pdfPath2);
  console.log('PDF copy created at:', pdfPath2);
  
  await browser.close();
}

main().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
