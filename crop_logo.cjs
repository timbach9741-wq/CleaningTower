const sharp = require('sharp');

async function processLogo() {
  try {
    const metadata = await sharp('public/logo.jfif').metadata();
    console.log('Original dimensions:', metadata.width, 'x', metadata.height);

    // As a rough guess for a 1:1 square crop from the center
    const size = Math.floor(Math.min(metadata.width, metadata.height) * 0.35); // make crop slightly smaller
    const left = Math.floor((metadata.width - size) / 2);
    const top = Math.floor(metadata.height * 0.2); // Usually the logo is near the top middle

    await sharp('public/logo.jfif')
      .extract({ width: size, height: size, left: left, top: top })
      .toFile('public/logo_icon_temp.png');
    
    console.log('Cropped successfully to public/logo_icon_temp.png');
  } catch (err) {
    console.error('Error processing image:', err);
  }
}

processLogo();
