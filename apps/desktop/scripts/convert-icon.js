#!/usr/bin/env node
/**
 * Converts public/icon.svg to PNGs for electron-builder.
 * - assets/icon.png (512x512) for single-file use
 * - build/icons/*.png for Linux (sizes in filename so DEB installs to hicolor theme)
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const svgPath = path.join(projectRoot, 'public', 'icon.svg');
const assetsDir = path.join(projectRoot, 'assets');
const buildIconsDir = path.join(projectRoot, 'build', 'icons');
const sizes = [16, 32, 48, 64, 128, 256, 512];

async function main() {
  try {
    const sharp = require('sharp');
    if (!fs.existsSync(svgPath)) {
      console.warn('scripts/convert-icon.js: public/icon.svg not found, skipping.');
      return;
    }
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.mkdirSync(buildIconsDir, { recursive: true });

    const svgBuffer = await sharp(svgPath).toBuffer();
    await Promise.all([
      sharp(svgBuffer).resize(512, 512).png().toFile(path.join(assetsDir, 'icon.png')),
      ...sizes.map((s) =>
        sharp(svgBuffer).resize(s, s).png().toFile(path.join(buildIconsDir, `${s}x${s}.png`))
      ),
    ]);

    console.log(`Generated assets/icon.png and build/icons/ (${sizes.join(', ')}px) from icon.svg`);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.warn('scripts/convert-icon.js: sharp not installed. Run: pnpm add -D sharp');
    } else {
      console.warn('scripts/convert-icon.js: could not convert SVG to PNG:', err.message);
    }
    console.warn('Using default Electron icon. To use your SVG, add assets/icon.png (e.g. export from public/icon.svg).');
  }
}

main();
