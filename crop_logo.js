const sharp = require('sharp');

async function processLogo() {
  try {
    const metadata = await sharp('public/logo.jfif').metadata();
    console.log('Original dimensions:', metadata.width, 'x', metadata.height);

    // Assuming the icon is in the center-top. Let's crop it.
    // We can also extract the channel to make it transparent, but let's first crop.
    
    // As a rough guess for a 1:1 square crop from the center
    const size = Math.floor(Math.min(metadata.width, metadata.height) * 0.5);
    const left = Math.floor((metadata.width - size) / 2);
    const top = Math.floor(metadata.height * 0.15); // Slightly down from top

    await sharp('public/logo.jfif')
      .extract({ width: size, height: size, left: left, top: top })
      .toFile('public/logo_icon_temp.png');
    
    console.log('Cropped successfully to public/logo_icon_temp.png');
  } catch (err) {
    console.error('Error processing image:', err);
  }
}

processLogo();
