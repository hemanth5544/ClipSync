/**
 * Generate production PNG assets from SVG for ClipSync mobile (APK / iOS).
 * Run from apps/mobile: pnpm run generate-icons
 * Requires: pnpm add -D sharp (in apps/mobile or root)
 */
const fs = require("fs");
const path = require("path");

const assetsDir = path.join(__dirname, "..", "assets");

async function generate() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch (e) {
    console.error("Missing sharp. Install from repo root: pnpm add -D sharp --filter @clipsync/mobile");
    process.exit(1);
  }

  const size = 1024;

  // icon.png - full icon with background (from icon.svg)
  const iconSvg = path.join(assetsDir, "icon.svg");
  if (fs.existsSync(iconSvg)) {
    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(assetsDir, "icon.png"));
    console.log("Generated icon.png (1024x1024)");
  }

  // adaptive-icon.png - foreground only, transparent (from logo.svg)
  const logoSvg = path.join(assetsDir, "logo.svg");
  if (fs.existsSync(logoSvg)) {
    await sharp(logoSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(assetsDir, "adaptive-icon.png"));
    console.log("Generated adaptive-icon.png (1024x1024)");
  }

  // splash-icon.png - same as icon, or logo centered (Expo uses contain)
  const splashSource = fs.existsSync(iconSvg) ? iconSvg : logoSvg;
  if (splashSource) {
    await sharp(splashSource)
      .resize(size, size)
      .png()
      .toFile(path.join(assetsDir, "splash-icon.png"));
    console.log("Generated splash-icon.png (1024x1024)");
  }

  // favicon for web (48x48)
  const faviconSource = fs.existsSync(iconSvg) ? iconSvg : logoSvg;
  if (faviconSource) {
    await sharp(faviconSource)
      .resize(48, 48)
      .png()
      .toFile(path.join(assetsDir, "favicon.png"));
    console.log("Generated favicon.png (48x48)");
  }

  console.log("Done. Use these assets for EAS build / production APK.");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
