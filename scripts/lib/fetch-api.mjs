/**
 * Thin fetch layer for the Django portfolio API.
 *
 * Two behaviours matter here:
 *   - Retries with backoff, because the origin is a single DigitalOcean box.
 *   - Scheme normalisation, because the API returns `http://` absolute URLs for
 *     media and pagination (Django is behind a proxy without
 *     SECURE_PROXY_SSL_HEADER set). Left alone, those become blocked
 *     mixed-content requests on an HTTPS page.
 */
const DEFAULT_BASE = 'https://kmrifat.binarycastle.net/api';

export const apiBase = () => (process.env.API_BASE || DEFAULT_BASE).replace(/\/+$/, '');

/** Host whose URLs we are allowed to rewrite http -> https. */
const MEDIA_HOST = 'kmrifat.binarycastle.net';

/**
 * Upgrades http:// to https:// for our own host only.
 *
 * Third-party URLs (project demo links) are deliberately left untouched: some
 * genuinely have no TLS, and silently rewriting them would produce dead links.
 * Those are flagged as `insecure` instead and rendered with a warning.
 */
export function forceHttps(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' && parsed.hostname === MEDIA_HOST) {
      parsed.protocol = 'https:';
      return parsed.href;
    }
    return parsed.href;
  } catch {
    return url;
  }
}

export function isInsecure(url) {
  try {
    return new URL(url).protocol === 'http:';
  } catch {
    return false;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchJson(path, { retries = 3, timeoutMs = 15_000 } = {}) {
  const url = path.startsWith('http') ? path : `${apiBase()}${path}`;
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = 2 ** (attempt - 1) * 1000;
        console.warn(
          `    retry ${attempt}/${retries - 1} for ${url} after ${delay}ms — ${error.message}`,
        );
        await sleep(delay);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(`Failed to fetch ${url}: ${lastError?.message ?? 'unknown error'}`);
}

/**
 * Runs `worker` over `items` with bounded concurrency.
 *
 * Sixteen sequential detail requests against a small box is needlessly slow;
 * sixteen at once is needlessly rude. Four is a reasonable middle.
 */
export async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return results;
}
