const fs = require('fs');
const path = require('path');

// SVG template for a medical cross icon
const createSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.1}" fill="#0070f3"/>
  <rect x="${size * 0.35}" y="${size * 0.15}" width="${size * 0.3}" height="${size * 0.7}" rx="${size * 0.05}" fill="white"/>
  <rect x="${size * 0.15}" y="${size * 0.35}" width="${size * 0.7}" height="${size * 0.3}" rx="${size * 0.05}" fill="white"/>
</svg>
`;

// Icon sizes to generate
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate icons
sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = path.join(__dirname, '..', 'public', 'icons', `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Generated ${filename}`);
});

// Also create apple-touch-icon
const appleTouchIcon = createSVG(180);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon.svg'), appleTouchIcon);
console.log('Generated apple-touch-icon.svg');

// Create favicon SVG
const favicon = createSVG(32);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), favicon);
console.log('Generated favicon.svg');

console.log('All icons generated successfully!');