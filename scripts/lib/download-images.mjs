/**
 * Downloads remote images into src/assets/remote/ so Astro can optimise them at
 * build time and GitHub Pages can serve them from its own CDN.
 *
 * Design constraints, in order of importance:
 *
 *  1. **Failure is normal.** Every image on the Django host currently 404s. A
 *     missing image must never fail the build — it degrades to a generated
 *     placeholder card instead.
 *  2. **Never delete on failure.** If an image downloaded successfully last week
 *     and today's fetch times out, we keep the file we already have. Otherwise a
 *     transient outage would strip images from the site.
 *  3. **Content-addressed names.** The filename embeds a hash of the source URL,
 *     so re-running the sync produces byte-identical output and git sees no churn.
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, extname } from 'node:path';

const VALID_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif']);

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

/** Stable, collision-resistant filename derived from the slug and source URL. */
export function assetFilename(slug, url) {
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 8);
  let ext = extname(new URL(url).pathname).toLowerCase();
  if (!VALID_EXT.has(ext)) ext = '.png';
  return `${slug}-${hash}${ext}`;
}

/**
 * @returns {Promise<{src: string|null, status: 'ok'|'missing'|'none', origin: string|null}>}
 */
export async function downloadImage(url, slug, outDir, { timeoutMs = 20_000 } = {}) {
  if (!url) return { src: null, status: 'none', origin: null };

  const filename = assetFilename(slug, url);
  const relative = `remote/${filename}`;
  const absolute = join(outDir, filename);

  // Already have it — content-addressed, so the bytes cannot have changed.
  if (await exists(absolute)) {
    return { src: relative, status: 'ok', origin: url };
  }

  await mkdir(outDir, { recursive: true });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return { src: null, status: 'missing', origin: url };
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // A 200 with an HTML body means we hit an error page or a login redirect,
    // not an image. Writing it would produce a corrupt asset that fails the build.
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/') || buffer.length === 0) {
      return { src: null, status: 'missing', origin: url };
    }

    await writeFile(absolute, buffer);
    return { src: relative, status: 'ok', origin: url };
  } catch {
    return { src: null, status: 'missing', origin: url };
  } finally {
    clearTimeout(timer);
  }
}
