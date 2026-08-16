/**
 * Rasterises public/favicon.svg into the PNG icons the web app manifest needs.
 *
 * The 2022 manifest referenced pwa-192x192.png and pwa-512x512.png but neither
 * file was ever committed, so both 404'd on the live site. Generating them from
 * the SVG keeps the set in sync and means there is nothing to forget.
 *
 * Run manually after changing the logo:  node scripts/generate-icons.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');

const svg = await readFile(join(publicDir, 'favicon.svg'));

const targets = [
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  // Maskable icons need the artwork inside the safe zone, so the glyph is
  // scaled down onto a solid brand background rather than bleeding to the edge.
  { file: 'pwa-maskable-512x512.png', size: 512, maskable: true },
];

for (const { file, size, maskable } of targets) {
  let image;

  if (maskable) {
    const inner = Math.round(size * 0.6);
    const pad = Math.round((size - inner) / 2);
    const glyph = await sharp(svg, { density: 384 })
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    image = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0xff, g: 0x45, b: 0x00, alpha: 1 },
      },
    }).composite([{ input: glyph, top: pad, left: pad }]);
  } else {
    image = sharp(svg, { density: 384 }).resize(size, size, { fit: 'contain' });
  }

  await writeFile(join(publicDir, file), await image.png({ compressionLevel: 9 }).toBuffer());
  console.log(`  generated public/${file}  (${size}×${size})`);
}

console.log('Icons written.');
