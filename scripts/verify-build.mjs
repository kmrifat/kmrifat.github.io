/**
 * Publication gate.
 *
 * Runs after `astro build` in CI and refuses to let a structurally broken site
 * reach GitHub Pages. This exists because a static build can "succeed" while
 * producing an empty catalogue — if the content snapshot were ever truncated,
 * Astro would happily emit a valid but contentless site, and nothing else in the
 * pipeline would notice.
 *
 * Exit 0 = safe to publish. Exit 1 = do not deploy.
 */
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { DEFAULT_PAGE_SIZE } from '../src/lib/types.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const failures = [];
const notes = [];

const exists = async (path) => {
  try {
    return await stat(path);
  } catch {
    return null;
  }
};

const read = async (path) => {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------- core files

const home = await read(join(dist, 'index.html'));
if (!home) {
  failures.push('dist/index.html is missing');
} else if (home.length < 1024) {
  failures.push(`dist/index.html is only ${home.length} bytes — almost certainly empty`);
} else if (!/<h1[\s>]/.test(home)) {
  failures.push('dist/index.html has no <h1> — the page rendered without content');
}

if (!(await exists(join(dist, '404.html')))) {
  failures.push('dist/404.html is missing — GitHub Pages needs it for unknown paths');
}

// Without .nojekyll, GitHub Pages hides every directory beginning with an
// underscore, which silently breaks all of /_astro/.
if (!(await exists(join(dist, '.nojekyll')))) {
  failures.push('dist/.nojekyll is missing — /_astro/ assets would 404 on Pages');
}

if (!(await exists(join(dist, 'sitemap-index.xml')))) {
  failures.push('dist/sitemap-index.xml is missing');
}

// The kill switch must survive every build, at exactly this path, or visitors
// carrying the 2022 service worker keep getting served the old site.
const sw = await read(join(dist, 'sw.js'));
if (!sw) {
  failures.push('dist/sw.js is missing — the old service worker would never be unregistered');
} else if (!sw.includes('unregister')) {
  failures.push('dist/sw.js does not call unregister() — it is not the kill switch');
}

// ------------------------------------------------------------ the catalogue

const snapshot = await read(join(root, 'src/data/projects.json'));

if (snapshot) {
  let expected = 0;
  try {
    const parsed = JSON.parse(snapshot);
    expected = Array.isArray(parsed) ? parsed.length : (parsed.projects?.length ?? 0);
  } catch {
    failures.push('src/data/projects.json is not valid JSON');
  }

  if (expected === 0) {
    failures.push(
      'src/data/projects.json contains no projects — refusing to publish an empty catalogue',
    );
  }

  const listing = await read(join(dist, 'projects/index.html'));
  if (!listing) {
    failures.push('dist/projects/index.html is missing but a project snapshot exists');
  } else {
    // The listing island is server-rendered, so the static HTML contains at most
    // one page of cards. Anything fewer than that means the render broke.
    const onFirstPage = Math.min(expected, DEFAULT_PAGE_SIZE);
    const rendered = (listing.match(/data-project=/g) ?? []).length;

    if (rendered === 0) {
      failures.push('dist/projects/index.html rendered zero project cards');
    } else if (rendered !== onFirstPage) {
      failures.push(`dist/projects/index.html rendered ${rendered} cards, expected ${onFirstPage}`);
    } else {
      notes.push(`catalogue: ${rendered}/${expected} project cards in the static listing`);
      if (expected > DEFAULT_PAGE_SIZE) {
        // Not fatal — every project still has its own page in the sitemap — but
        // it does mean the listing page no longer links to all of them.
        notes.push(
          `NOTE: ${expected - DEFAULT_PAGE_SIZE} project(s) are only reachable with JS enabled; ` +
            'consider raising DEFAULT_PAGE_SIZE',
        );
      }
    }
  }
} else {
  notes.push('no content snapshot yet — skipping catalogue checks');
}

// ------------------------------------------------------------------- report

for (const note of notes) console.log(`  · ${note}`);

if (failures.length > 0) {
  console.error('\nBuild verification FAILED:');
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error('\nRefusing to publish.');
  process.exit(1);
}

console.log('\nBuild verified — safe to publish.');
