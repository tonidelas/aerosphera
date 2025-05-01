const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../src/logo.svg');
const publicPath = path.join(__dirname, '../public');

// Read SVG content
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Generate favicon.ico (16x16, 32x32, 48x48)
sharp(Buffer.from(svgContent))
  .resize(48, 48)
  .toFile(path.join(publicPath, 'favicon.ico'))
  .catch(err => console.error('Error generating favicon.ico:', err));

// Generate logo192.png
sharp(Buffer.from(svgContent))
  .resize(192, 192)
  .toFile(path.join(publicPath, 'logo192.png'))
  .catch(err => console.error('Error generating logo192.png:', err));

// Generate logo512.png
sharp(Buffer.from(svgContent))
  .resize(512, 512)
  .toFile(path.join(publicPath, 'logo512.png'))
  .catch(err => console.error('Error generating logo512.png:', err)); 