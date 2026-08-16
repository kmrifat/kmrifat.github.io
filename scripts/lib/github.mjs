/**
 * Pulls open-source work from the GitHub API at build time.
 *
 * The Django catalogue only knows about client and product work that was
 * entered into its admin. It has no idea that StoreKeeper has 78 stars or that
 * django_chat has 70 — arguably the strongest public signals available, and
 * previously visible nowhere on the site.
 *
 * Curation is explicit rather than "everything public": the personal account
 * carries a decade of throwaway test repos (spring_crud, react-practice,
 * one-off JavaFX experiments) that would bury the real work. The rules below
 * are the whole policy, and are meant to be edited by hand.
 */

/** Every non-archived public repo in these orgs is included. */
const ORGS = ['binary-castle'];

/** Personal repos are included when they clear this star count… */
const STAR_THRESHOLD = 10;

/** …or when named here regardless of stars. */
const ALWAYS_INCLUDE = new Set(['sb-form', 'laravel-shopify', 'django-commerce']);

/** Never included, whatever their stars. */
const NEVER_INCLUDE = new Set([
  'kmrifat', // GitHub profile README
  'kmrifat.github.io', // this site
  'leetcode',
  'give-feedbacks',
  'react-practice',
  'play-with-swift',
  'dap-doc', // documentation-only, excluded at Rifat's request
  // Dropped at Rifat's request despite clearing the star threshold: a 2017
  // jQuery snippet, and the original JavaFX Dr-Assistant which the Laravel
  // product long superseded. Stars alone were overstating both.
  'jQuery-Filter-Search-div',
  'Dr-Assistant',
]);

/**
 * Pinned to the top of the CV's open-source list regardless of star count.
 *
 * Star counts favour old repos; these are the ones worth leading with today.
 */
export const FEATURED_REPOS = ['bc-ui-flutter'];

const USER = 'kmrifat';

async function ghFetch(path) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  // Optional — unauthenticated allows 60 requests/hour, and we make two.
  // GitHub Actions provides GITHUB_TOKEN automatically.
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`https://api.github.com${path}`, {
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`GitHub ${path} -> HTTP ${response.status}`);
  return response.json();
}

const normalise = (repo, owner) => ({
  name: repo.name,
  fullName: repo.full_name,
  owner,
  url: repo.html_url,
  homepage: repo.homepage || null,
  description: repo.description || null,
  language: repo.language || null,
  topics: repo.topics ?? [],
  stars: repo.stargazers_count,
  forks: repo.forks_count,
  createdAt: repo.created_at.slice(0, 10),
  pushedAt: repo.pushed_at.slice(0, 10),
});

/**
 * @returns {Promise<Array>} curated repos, most-starred first, then most recent.
 */
export async function fetchOpenSource() {
  const collected = [];

  const personal = await ghFetch(`/users/${USER}/repos?per_page=100&sort=updated`);
  for (const repo of personal) {
    if (repo.fork || repo.archived || repo.private) continue;
    if (NEVER_INCLUDE.has(repo.name)) continue;
    if (repo.stargazers_count < STAR_THRESHOLD && !ALWAYS_INCLUDE.has(repo.name)) continue;
    collected.push(normalise(repo, USER));
  }

  for (const org of ORGS) {
    const repos = await ghFetch(`/orgs/${org}/repos?per_page=100&sort=updated`);
    for (const repo of repos) {
      if (repo.fork || repo.archived || repo.private) continue;
      if (NEVER_INCLUDE.has(repo.name)) continue;
      collected.push(normalise(repo, org));
    }
  }

  return collected.sort((a, b) => b.stars - a.stars || b.pushedAt.localeCompare(a.pushedAt));
}
