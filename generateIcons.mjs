// generateIcons.mjs
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create icons directory
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Check if user has a logo
const possibleLogos = [
  path.join(__dirname, 'public', 'logo.png'),
  path.join(__dirname, 'public', 'logo.svg'),
  path.join(__dirname, 'public', 'icon.svg'),
  path.join(__dirname, 'app', 'icon.png'),
];

let sourceIcon = null;
for (const logo of possibleLogos) {
  if (fs.existsSync(logo)) {
    sourceIcon = logo;
    break;
  }
}

async function generateIcons() {
  if (!sourceIcon) {
    console.log('⚠️  No logo found. Creating simple placeholder icons...');
    
    // Create simple blue square with "R" text as placeholder
    const svgIcon = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="#3b82f6" rx="80"/>
        <text x="256" y="380" font-family="Arial, sans-serif" font-size="350" 
              font-weight="bold" fill="white" text-anchor="middle">R</text>
      </svg>
    `;
    
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      try {
        await sharp(Buffer.from(svgIcon))
          .resize(size, size)
          .png()
          .toFile(outputPath);
        
        console.log(`✅ Generated ${size}x${size} icon`);
      } catch (error) {
        console.error(`❌ Error generating ${size}x${size}:`, error.message);
      }
    }
    
    console.log('\n💡 TIP: Replace these with your actual logo by:');
    console.log('   1. Adding logo.png (at least 512x512) to the public/ folder');
    console.log('   2. Running: node generateIcons.mjs again\n');
    
  } else {
    console.log('🎨 Found logo:', sourceIcon);
    console.log('🎨 Generating app icons...\n');

    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      try {
        await sharp(sourceIcon)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toFile(outputPath);
        
        console.log(`✅ Generated ${size}x${size} icon`);
      } catch (error) {
        console.error(`❌ Error generating ${size}x${size}:`, error.message);
      }
    }
  }

  // Generate favicon
  try {
    if (sourceIcon) {
      await sharp(sourceIcon)
        .resize(32, 32)
        .png()
        .toFile(path.join(__dirname, 'public', 'favicon.ico'));
    } else {
      const svgIcon = `
        <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" fill="#3b82f6" rx="5"/>
          <text x="16" y="24" font-family="Arial, sans-serif" font-size="20" 
                font-weight="bold" fill="white" text-anchor="middle">R</text>
        </svg>
      `;
      await sharp(Buffer.from(svgIcon))
        .resize(32, 32)
        .png()
        .toFile(path.join(__dirname, 'public', 'favicon.ico'));
    }
    console.log('✅ Generated favicon.ico');
  } catch (error) {
    console.error('❌ Error generating favicon:', error.message);
  }

  console.log('\n🎉 All icons generated successfully!');
  console.log('📱 Your app is now ready to be installed!\n');
}

generateIcons();