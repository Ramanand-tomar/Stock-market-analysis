/**
 * Icon & Splash Asset Generator for Intelly Stock Analyser
 *
 * Run: npx sharp-cli to install, then:
 *   node scripts/generate-icons.js
 *
 * Or use any SVG-to-PNG converter with these source files:
 *   - assets/icon.svg          → assets/icon.png         (1024x1024)
 *   - assets/adaptive-icon.svg → assets/adaptive-icon.png (1024x1024)
 *   - assets/splash-icon.svg   → assets/splash-icon.png  (300x300)
 *   - assets/icon.svg          → assets/favicon.png      (48x48)
 *
 * Quick online alternative:
 *   1. Open each .svg file in a browser
 *   2. Use https://svgtopng.com/ or similar
 *   3. Save the outputs with the correct filenames above
 */

const fs = require('fs');
const path = require('path');

async function generate() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('\\n--- Intelly Icon Generator ---\\n');
    console.log('sharp is not installed. Install it first:\\n');
    console.log('  npm install --save-dev sharp\\n');
    console.log('Then re-run: node scripts/generate-icons.js\\n');
    console.log('Or manually convert the SVG files in assets/ to PNG:');
    console.log('  icon.svg          → icon.png         (1024x1024)');
    console.log('  adaptive-icon.svg → adaptive-icon.png (1024x1024)');
    console.log('  splash-icon.svg   → splash-icon.png   (300x300)');
    console.log('  icon.svg          → favicon.png        (48x48)');
    process.exit(0);
  }

  const assetsDir = path.join(__dirname, '..', 'assets');

  const tasks = [
    { src: 'icon.svg', out: 'icon.png', size: 1024 },
    { src: 'adaptive-icon.svg', out: 'adaptive-icon.png', size: 1024 },
    { src: 'splash-icon.svg', out: 'splash-icon.png', size: 300 },
    { src: 'icon.svg', out: 'favicon.png', size: 48 },
  ];

  for (const task of tasks) {
    const srcPath = path.join(assetsDir, task.src);
    const outPath = path.join(assetsDir, task.out);

    if (!fs.existsSync(srcPath)) {
      console.log(`  SKIP: ${task.src} not found`);
      continue;
    }

    const svgBuffer = fs.readFileSync(srcPath);
    await sharp(svgBuffer)
      .resize(task.size, task.size)
      .png()
      .toFile(outPath);

    console.log(`  OK: ${task.out} (${task.size}x${task.size})`);
  }

  console.log('\\nDone! All icon assets generated.');
}

generate().catch(console.error);
