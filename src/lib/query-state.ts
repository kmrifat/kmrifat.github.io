import type { FilterState } from './filter';
import type { Ordering } from './types';
import { DEFAULT_ORDERING, DEFAULT_PAGE_SIZE, FACET_KEYS, MAX_PAGE_SIZE, ORDERINGS } from './types';

/**
 * Translation between the URL query string and filter state.
 *
 * The seven parameter names from the 2022 site are preserved exactly — `search`,
 * `technologies`, `categories`, `apis`, `tags`, `page`, `page_size` — so links
 * people saved still resolve. `ordering` is new.
 *
 * Two bugs from the old implementation are fixed here rather than in the UI:
 *   - It wrote every parameter unconditionally, so every URL carried
 *     `?search=&technologies=&categories=&apis=&tags=&page=1&page_size=10`.
 *     Defaults and empties are now omitted.
 *   - It joined values with `.toString()` and never encoded them, so a value
 *     like "Vue.js" or any name containing `&` produced a malformed URL.
 */

const VALID_ORDERINGS = new Set<string>(ORDERINGS.map((o) => o.value));

export const emptyState = (): FilterState => ({
  search: '',
  technologies: [],
  categories: [],
  apis: [],
  tags: [],
  ordering: DEFAULT_ORDERING,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
});

/** Splits a comma-joined parameter, tolerating stray whitespace and empties. */
const splitList = (raw: string | null): string[] =>
  (raw ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

const clampInt = (raw: string | null, fallback: number, min: number, max: number): number => {
  const parsed = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

export function parseQuery(search: string | URLSearchParams): FilterState {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const state = emptyState();

  state.search = (params.get('search') ?? '').trim();

  for (const key of FACET_KEYS) {
    state[key] = splitList(params.get(key));
  }

  const ordering = params.get('ordering');
  if (ordering && VALID_ORDERINGS.has(ordering)) {
    state.ordering = ordering as Ordering;
  } else if (state.search) {
    // An unspecified ordering alongside a search means "most relevant".
    state.ordering = 'relevance';
  }

  state.page = clampInt(params.get('page'), 1, 1, Number.MAX_SAFE_INTEGER);
  state.pageSize = clampInt(params.get('page_size'), DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);

  return state;
}

/**
 * Serialises state back to a query string, omitting anything at its default.
 *
 * Commas are decoded back to literal `,` after encoding so multi-value filters
 * stay readable (`?technologies=django,vue-js`) while individual values remain
 * correctly escaped.
 */
export function buildQuery(state: FilterState): string {
  const params = new URLSearchParams();

  if (state.search.trim()) params.set('search', state.search.trim());

  for (const key of FACET_KEYS) {
    if (state[key].length > 0) params.set(key, state[key].join(','));
  }

  // `relevance` is implied by the presence of a search term, so it is never written.
  const impliedOrdering: Ordering = state.search.trim() ? 'relevance' : DEFAULT_ORDERING;
  if (state.ordering !== impliedOrdering) params.set('ordering', state.ordering);

  if (state.page > 1) params.set('page', String(state.page));
  if (state.pageSize !== DEFAULT_PAGE_SIZE) params.set('page_size', String(state.pageSize));

  return params.toString().replace(/%2C/g, ',');
}

/** Full path plus query, ready for `history.pushState`. */
export function buildUrl(state: FilterState, pathname = '/projects/'): string {
  const query = buildQuery(state);
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * Identity of the *result set* a state produces, ignoring pagination.
 *
 * Used to decide between pushState and replaceState: only a change that alters
 * which projects match deserves its own history entry.
 */
export function filterSignature(state: FilterState): string {
  return JSON.stringify([
    state.search.trim().toLowerCase(),
    ...FACET_KEYS.map((key) => [...state[key]].sort()),
    state.ordering,
    state.pageSize,
  ]);
}

export function hasActiveFilters(state: FilterState): boolean {
  return Boolean(state.search.trim()) || FACET_KEYS.some((key) => state[key].length > 0);
}

/**
 * Updates the search term, applying the same implied-ordering rule as `parseQuery`.
 *
 * Without this, typing into the search box would leave `ordering` at its
 * no-search default of `-id`, which `buildQuery` must then write explicitly —
 * producing a noisy `?search=x&ordering=-id` and sorting by recency when the
 * user plainly wants the best match first. Going through here keeps the state
 * consistent with what the same URL would parse back to.
 */
export function setSearch(state: FilterState, search: string): FilterState {
  const hadSearch = Boolean(state.search.trim());
  const hasSearch = Boolean(search.trim());

  let ordering = state.ordering;
  if (!hadSearch && hasSearch && ordering === DEFAULT_ORDERING) {
    ordering = 'relevance';
  } else if (hadSearch && !hasSearch && ordering === 'relevance') {
    ordering = DEFAULT_ORDERING;
  }

  return { ...state, search, ordering, page: 1 };
}

/** Toggles a single facet value, always resetting to page 1. */
export function toggleFacet(
  state: FilterState,
  key: (typeof FACET_KEYS)[number],
  value: string,
): FilterState {
  const active = state[key];
  const next = active.includes(value)
    ? active.filter((entry) => entry !== value)
    : [...active, value];

  // Resetting the page is the fix for the old site's most visible bug: changing
  // a filter while on page 5 left you on a page that no longer existed.
  return { ...state, [key]: next, page: 1 };
}
