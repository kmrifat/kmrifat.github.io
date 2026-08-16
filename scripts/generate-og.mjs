/**
 * Generates static Open Graph cards into public/og/.
 *
 * Written with sharp rather than astro-og-canvas: that package's `OGImageRoute`
 * exports `getStaticPaths` via destructuring, which Astro 7's route analysis
 * does not detect, so the route never builds. Rendering the cards here instead
 * removes the dependency entirely and keeps the output fully deterministic.
 *
 * Cards are deliberately typographic and never load `feature_image` — every
 * image on the Django host currently 404s, and a social card showing a broken
 * image is worse than one showing type.
 *
 * Run:  node scripts/generate-og.mjs   (wired into `npm run build`)
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/og');

const WIDTH = 1200;
const HEIGHT = 630;

/** XML-escapes text destined for an SVG text node. */
const esc = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Greedy word wrap.
 *
 * SVG has no text flow, so lines have to be measured and broken manually. The
 * per-character width is an approximation tuned for the font size in use — good
 * enough for a card, and it avoids shipping a font-metrics library.
 */
function wrap(text, maxChars, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = candidate;
    }
  }

  if (lines.length < maxLines && line) lines.push(line);

  // Ellipsise if we ran out of room.
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[\s,.;:-]+$/, '')}…`;
  }

  return lines;
}

function card({ title, description, eyebrow }) {
  const titleLines = wrap(title, 26, 3);
  const descLines = description ? wrap(description, 58, 2) : [];

  const titleSize = titleLines.length > 2 ? 62 : 72;
  const titleTop = 250 - (titleLines.length - 1) * (titleSize * 0.55);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#141211"/>
      <stop offset="1" stop-color="#221f1d"/>
    </linearGradient>
    <linearGradient id="rail" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FF4500"/>
      <stop offset="1" stop-color="#00A887"/>
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect x="0" y="0" width="14" height="${HEIGHT}" fill="url(#rail)"/>

  <text x="82" y="132" font-family="Helvetica, Arial, sans-serif" font-size="26"
        font-weight="600" letter-spacing="3" fill="#FF6A38">${esc(eyebrow.toUpperCase())}</text>

  ${titleLines
    .map(
      (line, index) =>
        `<text x="82" y="${titleTop + index * titleSize * 1.16}" font-family="Helvetica, Arial, sans-serif" ` +
        `font-size="${titleSize}" font-weight="700" fill="#FAF9F8">${esc(line)}</text>`,
    )
    .join('\n  ')}

  ${descLines
    .map(
      (line, index) =>
        `<text x="82" y="${470 + index * 44}" font-family="Helvetica, Arial, sans-serif" ` +
        `font-size="32" fill="#A29A93">${esc(line)}</text>`,
    )
    .join('\n  ')}

  <text x="82" y="574" font-family="Helvetica, Arial, sans-serif" font-size="26"
        fill="#78706A">kmrifat.github.io</text>
</svg>`;
}

let written = 0;

async function write(slug, options) {
  written += 1;
  const path = join(outDir, `${slug}.png`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    await sharp(Buffer.from(card(options)))
      .png({ compressionLevel: 9 })
      .toBuffer(),
  );
  return path;
}

const projects = JSON.parse(await readFile(join(root, 'src/data/projects.json'), 'utf8'));

await mkdir(outDir, { recursive: true });

await write('index', {
  eyebrow: 'Technical Lead & Full-stack Engineer',
  title: 'K M Rifat Ul Alom',
  description:
    'A decade of shipped software — Django, Laravel, Vue and the products built on them.',
});

await write('about', {
  eyebrow: 'Journey',
  title: 'Student project to studio',
  description: 'JavaFX, CodeCanyon, CTO at Mediusware, tech lead at Debutify, now Binary Castle.',
});

let repoCount = 0;
let starCount = 0;
try {
  const repos = JSON.parse(await readFile(join(root, 'src/data/repos.json'), 'utf8'));
  repoCount = repos.length;
  starCount = repos.reduce((sum, repo) => sum + repo.stars, 0);
} catch {
  // repos.json only exists once a sync has run with GitHub reachable.
}

if (repoCount > 0) {
  await write('open-source', {
    eyebrow: 'Open source',
    title: `${repoCount} repositories`,
    description: `${starCount} stars across Flutter, Vue, Django, Laravel and JavaFX.`,
  });
}

await write('projects', {
  eyebrow: 'Projects',
  title: `${projects.length} projects`,
  description: 'Web platforms, SaaS products and open-source tools.',
});

for (const project of projects) {
  await write(`projects/${project.slug}`, {
    eyebrow: project.categories[0]?.name ?? 'Project',
    title: project.name,
    description: project.shortDescription ?? '',
  });
}

console.log(`  generated ${written} OG cards in public/og/`);
