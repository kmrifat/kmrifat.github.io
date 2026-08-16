#!/usr/bin/env node
/**
 * Pulls the project catalogue out of the Django API and writes a committed
 * snapshot that the Astro build reads.
 *
 * Why a prebuild script rather than an Astro content loader:
 *   - Images must land in src/assets/ *before* Astro walks its asset graph.
 *   - A loader that throws fails the build; a committed snapshot lets the site
 *     rebuild successfully even when the Django box is down.
 *   - The API's CORS allowlist only contains the production origin, so nothing
 *     in a browser (including `astro dev`) can call it. Node is the only option.
 *   - A committed JSON file turns every content change into a readable git diff.
 *
 * Usage:
 *   node scripts/sync-content.mjs              # sync and write
 *   node scripts/sync-content.mjs --dry-run    # fetch and report, write nothing
 *   node scripts/sync-content.mjs --check      # exit 1 if the snapshot is stale
 */
import { writeFile, readFile, appendFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { fetchJson, forceHttps, isInsecure, mapPool, apiBase } from './lib/fetch-api.mjs';
import { downloadImage } from './lib/download-images.mjs';
import { slugify } from './lib/slugify.mjs';
import { youtubeId } from './lib/youtube.mjs';
import { fetchOpenSource } from './lib/github.mjs';
import {
  projectsFileSchema,
  facetGroupsSchema,
  reposFileSchema,
  syncMetaSchema,
  FACET_KEYS,
} from '../src/lib/schemas.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'src/data');
const assetsDir = join(root, 'src/assets/remote');

const argv = new Set(process.argv.slice(2));
const DRY_RUN = argv.has('--dry-run');
const CHECK = argv.has('--check');

const warnings = [];
const warn = (message) => {
  warnings.push(message);
  console.warn(`    ! ${message}`);
};

/** Stable JSON with a trailing newline, so diffs stay readable. */
const serialise = (value) => `${JSON.stringify(value, null, 2)}\n`;

/** Maps an API taxonomy row to our term shape. */
const toTerm = (row) => ({ id: row.id, name: row.name, slug: slugify(row.name) });

/** The API field name for each of our facet keys. */
const FACET_SOURCE = {
  technologies: 'technologies',
  categories: 'categories',
  apis: 'apis',
  tags: 'tags',
};

async function main() {
  console.log(`Syncing from ${apiBase()}`);

  /* ------------------------------------------------------------- fetch --- */

  let utils;
  let listing;
  try {
    [utils, listing] = await Promise.all([
      fetchJson('/portfolio/sidebar-utils/'),
      // Verified: page_size=1000 returns the whole catalogue with next: null.
      fetchJson('/portfolio/projects/?page_size=1000'),
    ]);
  } catch (error) {
    // The API being unreachable must not fail the build — we simply keep the
    // snapshot that is already committed.
    console.error(`\n  API unreachable: ${error.message}`);
    console.error('  Keeping the existing snapshot. Build will proceed from committed data.');
    await setOutput('sync_changed', 'false');
    return 0;
  }

  const summaries = listing.results ?? [];
  if (summaries.length === 0) {
    console.error('\n  API returned zero projects — refusing to write an empty catalogue.');
    return 1;
  }
  if (listing.next) {
    warn(`API paginated unexpectedly (count=${listing.count}); only the first page was read`);
  }

  console.log(`  ${summaries.length} projects listed`);

  /* ---------------------------------------------------------- details --- */

  // Driven from the LIST response deliberately: the list endpoint filters
  // active=True while the detail endpoint does not, so iterating list slugs is
  // what keeps deactivated projects out of the build.
  const details = await mapPool(summaries, 4, async (summary) => {
    try {
      return await fetchJson(`/portfolio/project/${summary.slug}/`);
    } catch (error) {
      warn(`detail fetch failed for "${summary.slug}" (${error.message}); using list data only`);
      return null;
    }
  });

  /* --------------------------------------------------------- normalise --- */

  let imagesOk = 0;
  let imagesMissing = 0;

  const projects = [];

  for (const [index, summary] of summaries.entries()) {
    const detail = details[index] ?? {};
    const slug = summary.slug;

    const featureImage = await resolveImage(summary.feature_image, slug, summary.name);
    if (featureImage.status === 'ok') imagesOk += 1;
    if (featureImage.status === 'missing') imagesMissing += 1;

    const screenshots = [];
    for (const shot of detail.screenshots ?? []) {
      const image = await resolveImage(shot.image, slug, shot.image_title ?? summary.name);
      if (image.status === 'ok') imagesOk += 1;
      if (image.status === 'missing') imagesMissing += 1;
      screenshots.push({ image, title: shot.image_title ?? null });
    }

    const features = (detail.features ?? []).map((f) => ({
      title: f.title,
      description: f.description ?? null,
    }));

    // The list endpoint returns only buttons with show_in_list=True; the detail
    // endpoint returns all of them. Prefer the detail set when we have it.
    const buttons = (detail.buttons ?? summary.buttons ?? []).map((b) => {
      const insecure = isInsecure(b.url);
      if (insecure) warn(`"${slug}" links to an insecure URL: ${b.url}`);
      return { title: b.title, url: b.url, insecure };
    });

    const videoUrl = detail.video_url ?? summary.video_url ?? null;
    const parsedVideo = youtubeId(videoUrl);
    if (videoUrl && !parsedVideo) {
      warn(`"${slug}" has an unrecognised video URL: ${videoUrl}`);
    }

    const facets = {};
    for (const key of FACET_KEYS) {
      const source = detail[FACET_SOURCE[key]] ?? summary[FACET_SOURCE[key]] ?? [];
      facets[key] = source.map(toTerm);
    }

    // Mirrors the server's search_fields: name, short_description, and
    // projectfeature__title. Lowercased once here rather than per keystroke.
    const searchBlob = [
      summary.name,
      summary.short_description ?? '',
      ...features.map((f) => f.title),
    ]
      .join(' ')
      .toLowerCase();

    projects.push({
      id: summary.id,
      name: summary.name,
      slug,
      shortDescription: summary.short_description ?? null,
      description: detail.description ?? null,
      featureImage,
      videoUrl,
      youtubeId: parsedVideo,
      features,
      contexts: (detail.contexts ?? []).map((c) => ({
        title: c.title,
        description: c.description ?? null,
      })),
      screenshots,
      buttons,
      ...facets,
      searchBlob,
    });
  }

  /* ------------------------------------------------------------ facets --- */

  // Counts come from the projects themselves rather than from sidebar-utils, so
  // a term that exists in the admin but is attached to nothing shows count 0 and
  // can be disabled in the UI instead of returning an empty result set.
  const facetGroups = {};
  for (const key of FACET_KEYS) {
    const counts = new Map();

    for (const project of projects) {
      for (const term of project[key]) {
        const existing = counts.get(term.slug);
        if (existing) existing.count += 1;
        else counts.set(term.slug, { ...term, count: 1 });
      }
    }

    // Seed any term the admin knows about but no active project uses.
    for (const row of utils[FACET_SOURCE[key]] ?? []) {
      const term = toTerm(row);
      if (!counts.has(term.slug)) counts.set(term.slug, { ...term, count: 0 });
    }

    facetGroups[key] = [...counts.values()].sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name),
    );
  }

  /* ------------------------------------------------------- open source --- */

  // A GitHub outage must not fail the sync — the committed repo snapshot simply
  // stays as it was, exactly like the project data.
  let repos = null;
  try {
    repos = reposFileSchema.parse(await fetchOpenSource());
    console.log(
      `  ${repos.length} open-source repos (${repos.reduce((sum, r) => sum + r.stars, 0)} stars total)`,
    );
  } catch (error) {
    warn(`GitHub sync skipped: ${error.message}`);
  }

  /* ---------------------------------------------------------- validate --- */

  const parsedProjects = projectsFileSchema.safeParse(projects);
  if (!parsedProjects.success) {
    console.error('\n  Snapshot failed validation — refusing to write bad data.');
    console.error(JSON.stringify(parsedProjects.error.issues.slice(0, 10), null, 2));
    return 1;
  }

  const parsedFacets = facetGroupsSchema.safeParse(facetGroups);
  if (!parsedFacets.success) {
    console.error('\n  Facets failed validation.');
    console.error(JSON.stringify(parsedFacets.error.issues.slice(0, 10), null, 2));
    return 1;
  }

  /* ------------------------------------------------------------- write --- */

  const meta = syncMetaSchema.parse({
    syncedAt: new Date().toISOString(),
    apiBase: apiBase(),
    projectCount: projects.length,
    imagesOk,
    imagesMissing,
    warnings,
  });

  const files = {
    'projects.json': serialise(parsedProjects.data),
    'facets.json': serialise(parsedFacets.data),
  };
  if (repos) files['repos.json'] = serialise(repos);

  const changed = await hasChanges(files);

  console.log(
    `\n  ${projects.length} projects · images ${imagesOk} ok / ${imagesMissing} missing · ${warnings.length} warnings`,
  );

  if (imagesMissing > 0 && imagesOk === 0) {
    console.log(
      '  NOTE: every image is unavailable. The site will render generated placeholder\n' +
        '        cards until /media/ is fixed on the Django host.',
    );
  }

  if (CHECK) {
    if (changed) {
      console.error('\n  Snapshot is stale — run `npm run sync`.');
      return 1;
    }
    console.log('\n  Snapshot is up to date.');
    return 0;
  }

  if (DRY_RUN) {
    console.log(`\n  --dry-run: ${changed ? 'would update' : 'no changes to'} the snapshot.`);
    return 0;
  }

  await mkdir(dataDir, { recursive: true });
  for (const [name, contents] of Object.entries(files)) {
    await writeFile(join(dataDir, name), contents);
  }
  // Meta always rewrites (it carries a timestamp), so it is excluded from the
  // change check to avoid a pointless commit on every scheduled run.
  await writeFile(join(dataDir, 'sync-meta.json'), serialise(meta));

  console.log(`\n  Wrote src/data/ — ${changed ? 'content changed' : 'content unchanged'}.`);
  await setOutput('sync_changed', String(changed));
  return 0;
}

/* --------------------------------------------------------------- helpers --- */

async function resolveImage(rawUrl, slug, alt) {
  const url = forceHttps(rawUrl);
  const result = await downloadImage(url, slug, assetsDir);
  if (result.status === 'missing') {
    warn(`image unavailable for "${slug}": ${url}`);
  }
  return { ...result, alt: alt ?? '' };
}

async function hasChanges(files) {
  for (const [name, contents] of Object.entries(files)) {
    let existing = null;
    try {
      existing = await readFile(join(dataDir, name), 'utf8');
    } catch {
      return true;
    }
    if (existing !== contents) return true;
  }
  return false;
}

/** Publishes a step output so the workflow can decide whether to commit. */
async function setOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  await appendFile(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

process.exit(await main());
