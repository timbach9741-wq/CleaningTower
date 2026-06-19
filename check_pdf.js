import fs from 'fs';
import path from 'path';

const desktopDir = 'C:\\Users\\PC\\Desktop';

try {
  const files = fs.readdirSync(desktopDir);
  console.log('--- Desktop Files List ---');
  files.forEach(file => {
    if (file.includes('QnA') || file.includes('답변서') || file.toLowerCase().endsWith('.pdf') || file.includes('û')) {
      const filePath = path.join(desktopDir, file);
      const stat = fs.statSync(filePath);
      
      // PDF 파일인 경우 첫 10바이트를 읽어서 PDF 헤더가 올바른지 검증
      let header = '';
      if (file.toLowerCase().endsWith('.pdf')) {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(10);
        fs.readSync(fd, buffer, 0, 10, 0);
        fs.closeSync(fd);
        header = buffer.toString('utf8');
      }
      
      console.log(`File: ${file} | Size: ${stat.size} bytes | Header: ${header || 'N/A'}`);
    }
  });
} catch (err) {
  console.error('Error reading desktop:', err);
}
