const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateIcons() {
  const inputImage = path.join(__dirname, 'public', 'logo.webp');
  
  if (!fs.existsSync(inputImage)) {
    console.error('Logo not found!');
    return;
  }

  try {
    // Generate 192x192
    await sharp(inputImage)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFormat('png')
      .toFile(path.join(__dirname, 'public', 'icon-192x192.png'));
    console.log('Created icon-192x192.png');

    // Generate 512x512
    await sharp(inputImage)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFormat('png')
      .toFile(path.join(__dirname, 'public', 'icon-512x512.png'));
    console.log('Created icon-512x512.png');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
