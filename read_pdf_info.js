import fs from 'fs';
import path from 'path';

const desktopDir = 'C:\\Users\\PC\\Desktop';

try {
  const files = fs.readdirSync(desktopDir);
  console.log('--- Desktop PDF Files Detail ---');
  files.forEach(file => {
    if (file.toLowerCase().endsWith('.pdf')) {
      const filePath = path.join(desktopDir, file);
      const stat = fs.statSync(filePath);
      
      // 첫 1000바이트를 읽어서 PDF 내부의 텍스트 조각을 파싱해 봅니다.
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(1000);
      fs.readSync(fd, buffer, 0, 1000, 0);
      fs.closeSync(fd);
      
      const contentStr = buffer.toString('utf8');
      
      console.log(`File: ${file} | Size: ${stat.size} bytes`);
      console.log(`Content excerpt: ${contentStr.substring(0, 300).replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')}`);
      console.log('------------------------------');
    }
  });
} catch (err) {
  console.error('Error:', err);
}
