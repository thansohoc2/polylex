/**
 * generate-icons.ts
 *
 * Generates native app icons and splash screens for iOS and Android
 * from pwa-512x512.png (produced by @vite-pwa/assets-generator).
 *
 * Usage:
 *   npm run generate:pwa-icons   ← generate pwa-512x512.png first
 *   npm run generate:icons       ← then run this script
 */

import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'public', 'icons');
const SRC_512 = path.join(ICONS_DIR, 'pwa-512x512.png');
const ANDROID_RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const IOS_APPICONSET = path.join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
const IOS_SPLASH_DIR = path.join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset');

// ─── Brand background colour (#0F172A) ────────────────────────────────────────
const BG = { r: 15, g: 23, b: 42, alpha: 1 };

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// ─── iOS AppIcon sizes ─────────────────────────────────────────────────────────
const IOS_ICONS: { file: string; size: number }[] = [
  { file: 'AppIcon-20@1x.png', size: 20 },
  { file: 'AppIcon-20@2x.png', size: 40 },
  { file: 'AppIcon-20@3x.png', size: 60 },
  { file: 'AppIcon-29@1x.png', size: 29 },
  { file: 'AppIcon-29@2x.png', size: 58 },
  { file: 'AppIcon-29@3x.png', size: 87 },
  { file: 'AppIcon-40@1x.png', size: 40 },
  { file: 'AppIcon-40@2x.png', size: 80 },
  { file: 'AppIcon-40@3x.png', size: 120 },
  { file: 'AppIcon-60@2x.png', size: 120 },
  { file: 'AppIcon-60@3x.png', size: 180 },
  { file: 'AppIcon-76@1x.png', size: 76 },
  { file: 'AppIcon-76@2x.png', size: 152 },
  { file: 'AppIcon-83.5@2x.png', size: 167 },
  { file: 'AppIcon-1024@1x.png', size: 1024 },
];

// ─── Android mipmap densities ──────────────────────────────────────────────────
const ANDROID_DENSITIES: { dir: string; size: number }[] = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

// ─── Android splash screen sizes ──────────────────────────────────────────────
const ANDROID_SPLASHES: { dir: string; width: number; height: number }[] = [
  { dir: 'drawable', width: 1280, height: 1920 },
  { dir: 'drawable-land-hdpi', width: 800, height: 480 },
  { dir: 'drawable-land-mdpi', width: 480, height: 320 },
  { dir: 'drawable-land-xhdpi', width: 1280, height: 720 },
  { dir: 'drawable-land-xxhdpi', width: 1920, height: 1080 },
  { dir: 'drawable-land-xxxhdpi', width: 2560, height: 1440 },
  { dir: 'drawable-port-hdpi', width: 480, height: 800 },
  { dir: 'drawable-port-mdpi', width: 320, height: 480 },
  { dir: 'drawable-port-xhdpi', width: 720, height: 1280 },
  { dir: 'drawable-port-xxhdpi', width: 1080, height: 1920 },
  { dir: 'drawable-port-xxxhdpi', width: 1440, height: 2560 },
];

// ─── iOS splash sizes ─────────────────────────────────────────────────────────
const IOS_SPLASHES: { file: string; width: number; height: number }[] = [
  { file: 'splash.png', width: 2732, height: 2732 },
  { file: 'splash@2x.png', width: 2732, height: 2732 },
  { file: 'splash@3x.png', width: 2732, height: 2732 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function makeSplash(
  width: number,
  height: number,
  outPath: string
): Promise<void> {
  const logoSize = Math.round(Math.min(width, height) * 0.28);
  const left = Math.round((width - logoSize) / 2);
  const top = Math.round((height - logoSize) / 2);

  const logoBuffer = await sharp(SRC_512).resize(logoSize, logoSize).png().toBuffer();

  await sharp({
    create: { width, height, channels: 4, background: BG },
  })
    .composite([{ input: logoBuffer, left, top }])
    .png()
    .toFile(outPath);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(SRC_512)) {
    console.error(`\n❌  Source file not found: ${SRC_512}`);
    console.error('   Run "npm run generate:pwa-icons" first to generate pwa-512x512.png\n');
    process.exit(1);
  }

  // iOS App Icons
  console.log('\n📱  Generating iOS AppIcons…');
  ensureDir(IOS_APPICONSET);
  await Promise.all(
    IOS_ICONS.map(({ file, size }) =>
      sharp(SRC_512)
        .resize(size, size)
        .png()
        .toFile(path.join(IOS_APPICONSET, file))
        .then(() => console.log(`    ✓ ${file}`))
    )
  );

  // Android mipmap launcher icons
  console.log('\n🤖  Generating Android mipmap icons…');
  await Promise.all(
    ANDROID_DENSITIES.flatMap(({ dir, size }) => {
      const d = path.join(ANDROID_RES, dir);
      ensureDir(d);
      return [
        sharp(SRC_512)
          .resize(size, size)
          .png()
          .toFile(path.join(d, 'ic_launcher.png'))
          .then(() => console.log(`    ✓ ${dir}/ic_launcher.png`)),
        sharp(SRC_512)
          .resize(size, size)
          .png()
          .toFile(path.join(d, 'ic_launcher_round.png'))
          .then(() => console.log(`    ✓ ${dir}/ic_launcher_round.png`)),
      ];
    })
  );

  // iOS splash screens
  console.log('\n🌟  Generating iOS splash screens…');
  ensureDir(IOS_SPLASH_DIR);
  for (const { file, width, height } of IOS_SPLASHES) {
    await makeSplash(width, height, path.join(IOS_SPLASH_DIR, file));
    console.log(`    ✓ ${file}`);
  }

  // Android splash screens
  console.log('\n🌟  Generating Android splash screens…');
  for (const { dir, width, height } of ANDROID_SPLASHES) {
    const d = path.join(ANDROID_RES, dir);
    ensureDir(d);
    await makeSplash(width, height, path.join(d, 'splash.png'));
    console.log(`    ✓ ${dir}/splash.png`);
  }

  console.log('\n✅  All icons and splash screens generated successfully!\n');
}

main().catch((err) => {
  console.error('\n❌  Error:', err.message ?? err);
  process.exit(1);
});
