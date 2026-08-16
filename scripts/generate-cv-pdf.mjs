/**
 * Renders the built /cv/ page to a PDF using headless Chrome.
 *
 * Runs after `astro build`, against `dist/cv/index.html` on disk — no dev server
 * needed. Chrome's `--print-to-pdf` honours the `@page` rules and print
 * stylesheet in cv.astro, so the output matches what "Save as PDF" produces in
 * the browser.
 *
 * No npm dependency on purpose: Puppeteer would pull a ~300 MB browser download
 * into the build for one page. Chrome is already present on this machine and on
 * GitHub's ubuntu runners.
 *
 * Failure is non-fatal. If no Chrome binary is found the script exits 0 with a
 * warning and the site simply links to the HTML /cv/ page instead — which is
 * fully readable and printable on its own.
 */
import { access, mkdir, stat, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SOURCE = join(root, 'dist/cv/index.html');
const OUT_DIR = join(root, 'dist/cv');
const OUT_FILE = join(OUT_DIR, 'K-M-Rifat-Ul-Alom-CV.pdf');

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

async function findChrome() {
  for (const candidate of CANDIDATES) {
    if (await exists(candidate)) return candidate;
  }
  return null;
}

if (!(await exists(SOURCE))) {
  console.warn('  CV PDF skipped: dist/cv/index.html not found — run astro build first.');
  process.exit(0);
}

const chrome = await findChrome();
if (!chrome) {
  console.warn('  CV PDF skipped: no Chrome binary found. /cv/ remains available as HTML.');
  console.warn('  Set CHROME_PATH to generate it.');
  process.exit(0);
}

await mkdir(OUT_DIR, { recursive: true });

// Chrome refuses to overwrite in some versions; start clean.
await rm(OUT_FILE, { force: true });

// A throwaway profile keeps this from touching the user's real Chrome session.
const profile = join(tmpdir(), `cv-pdf-${process.pid}`);

try {
  await run(
    chrome,
    [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      `--user-data-dir=${profile}`,
      '--no-pdf-header-footer',
      '--print-to-pdf-no-header',
      `--print-to-pdf=${OUT_FILE}`,
      '--virtual-time-budget=8000',
      pathToFileURL(SOURCE).href,
    ],
    { timeout: 90_000 },
  );

  const info = await stat(OUT_FILE);
  if (info.size < 4096) throw new Error(`output is only ${info.size} bytes`);

  console.log(
    `  generated dist/cv/${OUT_FILE.split('/').pop()} (${Math.round(info.size / 1024)} KB)`,
  );
} catch (error) {
  console.warn(`  CV PDF generation failed: ${error.message}`);
  console.warn('  /cv/ remains available as HTML. Not failing the build.');
} finally {
  await rm(profile, { recursive: true, force: true });
}
