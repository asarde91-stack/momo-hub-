const sharp = require('sharp');
const path = require('path');

const sizes = [192, 512];
const outputDir = path.join(__dirname, '..', 'public', 'icons');

// Create a simple icon: orange circle with "M" text
const svgIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B35;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#E55A2B;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.45}" 
        fill="white">M</text>
  <text x="50%" y="78%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-weight="600" font-size="${size * 0.13}" 
        fill="rgba(255,255,255,0.9)">HUB</text>
</svg>
`;

async function generateIcons() {
  for (const size of sizes) {
    const svg = svgIcon(size);
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Generated: icon-${size}x${size}.png`);
  }
}

generateIcons().catch(console.error);
