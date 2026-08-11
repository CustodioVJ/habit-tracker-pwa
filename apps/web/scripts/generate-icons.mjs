import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

const sourceSvg = path.join(publicDir, 'favicon.svg');

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function generate() {
  for (const { name, size } of sizes) {
    const output = path.join(publicDir, name);
    await sharp(sourceSvg).resize(size, size).png().toFile(output);
    console.log(`Generated ${name} (${size}x${size})`);
  }
  console.log('All icons generated successfully!');
}

generate().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
