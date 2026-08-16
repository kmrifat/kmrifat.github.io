import type { FacetKey, Ordering, Project } from './types';
import { FACET_KEYS } from './types';

/**
 * Pure filtering, sorting, and pagination over the project snapshot.
 *
 * Kept free of React and of any DOM API so it can be exercised directly in Node
 * and reused by the statically rendered facet pages. The old site did all of
 * this on the server behind a 1000 ms debounce; with 16 projects it is a
 * microsecond of array work, so the request disappears entirely.
 */

export interface FilterState {
  search: string;
  technologies: string[];
  categories: string[];
  apis: string[];
  tags: string[];
  ordering: Ordering;
  page: number;
  pageSize: number;
}

export interface FilterResult {
  /** The page of projects to render. */
  items: Project[];
  /** Total matches before pagination. */
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

/**
 * Matches a URL token against a taxonomy term.
 *
 * Accepts both the slug (`vue-js`) and the display name (`Vue.js`), so links
 * shared from the 2022 site — which used comma-joined display names — keep
 * working unchanged.
 */
const termMatches = (term: { slug: string; name: string }, token: string): boolean => {
  const needle = token.trim().toLowerCase();
  return term.slug === needle || term.name.toLowerCase() === needle;
};

/** True when the project carries at least one of the requested tokens (OR within a facet). */
function matchesFacet(project: Project, key: FacetKey, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const terms = project[key];
  return tokens.some((token) => terms.some((term) => termMatches(term, token)));
}

/**
 * Search over the precomputed blob (name + short description + feature titles),
 * mirroring the server's `search_fields`. Multiple whitespace-separated terms
 * are AND-ed, matching DRF's SearchFilter behaviour.
 */
function matchesSearch(project: Project, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return query
    .split(/[\s,]+/)
    .filter(Boolean)
    .every((term) => project.searchBlob.includes(term));
}

/** Relevance score — name hits outrank description and feature hits. */
function relevance(project: Project, search: string): number {
  const query = search.trim().toLowerCase();
  if (!query) return 0;
  const name = project.name.toLowerCase();
  if (name === query) return 100;
  if (name.startsWith(query)) return 75;
  if (name.includes(query)) return 50;
  if ((project.shortDescription ?? '').toLowerCase().includes(query)) return 25;
  return 10;
}

const comparators: Record<Exclude<Ordering, 'relevance'>, (a: Project, b: Project) => number> = {
  '-id': (a, b) => b.id - a.id,
  id: (a, b) => a.id - b.id,
  name: (a, b) => a.name.localeCompare(b.name),
  '-name': (a, b) => b.name.localeCompare(a.name),
};

export function sortProjects(projects: Project[], ordering: Ordering, search: string): Project[] {
  const sorted = [...projects];

  if (ordering === 'relevance') {
    // Ties fall back to newest-first so the order is always deterministic.
    return sorted.sort((a, b) => relevance(b, search) - relevance(a, search) || b.id - a.id);
  }

  return sorted.sort(comparators[ordering]);
}

/** Applies every filter without paginating — used by facet landing pages. */
export function filterProjects(projects: Project[], state: FilterState): Project[] {
  return projects.filter(
    (project) =>
      matchesSearch(project, state.search) &&
      FACET_KEYS.every((key) => matchesFacet(project, key, state[key])),
  );
}

export function applyFilters(projects: Project[], state: FilterState): FilterResult {
  const matched = sortProjects(filterProjects(projects, state), state.ordering, state.search);

  const pageSize = Math.max(1, state.pageSize);
  const pageCount = Math.max(1, Math.ceil(matched.length / pageSize));
  // An out-of-range page clamps to the last page rather than rendering an empty
  // grid — landing on `?page=9` after narrowing a filter should show results.
  const page = Math.min(Math.max(1, state.page), pageCount);
  const start = (page - 1) * pageSize;

  return {
    items: matched.slice(start, start + pageSize),
    total: matched.length,
    page,
    pageCount,
    pageSize,
  };
}

/** How many results each facet option would yield given the rest of the filters. */
export function facetCounts(
  projects: Project[],
  state: FilterState,
  key: FacetKey,
): Map<string, number> {
  // Count against everything *except* this facet, so the numbers describe what
  // toggling each option would do rather than what is already selected.
  const others = projects.filter(
    (project) =>
      matchesSearch(project, state.search) &&
      FACET_KEYS.filter((k) => k !== key).every((k) => matchesFacet(project, k, state[k])),
  );

  const counts = new Map<string, number>();
  for (const project of others) {
    for (const term of project[key]) {
      counts.set(term.slug, (counts.get(term.slug) ?? 0) + 1);
    }
  }
  return counts;
}
