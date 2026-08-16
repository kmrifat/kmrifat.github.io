import { describe, expect, it } from 'vitest';
import {
  buildQuery,
  parseQuery,
  filterSignature,
  toggleFacet,
  setSearch,
  emptyState,
} from './query-state';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './types';

describe('parseQuery', () => {
  it('reads the seven legacy parameters from the 2022 site', () => {
    const state = parseQuery(
      'search=pos&technologies=Django,Vue.js&categories=SaaS&apis=Stripe&tags=AWS&page=2&page_size=10',
    );

    expect(state.search).toBe('pos');
    expect(state.technologies).toEqual(['Django', 'Vue.js']);
    expect(state.categories).toEqual(['SaaS']);
    expect(state.apis).toEqual(['Stripe']);
    expect(state.tags).toEqual(['AWS']);
    expect(state.page).toBe(2);
    expect(state.pageSize).toBe(10);
  });

  it('accepts slugs as well as display names', () => {
    expect(parseQuery('technologies=vue-js,django-rest-framework').technologies).toEqual([
      'vue-js',
      'django-rest-framework',
    ]);
  });

  it('tolerates the empty parameters the old site always emitted', () => {
    const state = parseQuery('search=&technologies=&categories=&apis=&tags=&page=1&page_size=10');
    expect(state.search).toBe('');
    expect(state.technologies).toEqual([]);
    expect(state.page).toBe(1);
  });

  it('defaults to relevance ordering when searching', () => {
    expect(parseQuery('search=pos').ordering).toBe('relevance');
    expect(parseQuery('').ordering).toBe('-id');
  });

  it('ignores an unknown ordering rather than trusting it', () => {
    expect(parseQuery('ordering=DROP TABLE').ordering).toBe('-id');
  });

  it('clamps page_size into range', () => {
    expect(parseQuery('page_size=99999').pageSize).toBe(MAX_PAGE_SIZE);
    expect(parseQuery('page_size=-4').pageSize).toBe(1);
    expect(parseQuery('page_size=abc').pageSize).toBe(DEFAULT_PAGE_SIZE);
  });
});

describe('buildQuery', () => {
  it('omits every default — no more ?search=&technologies=&…&page=1', () => {
    expect(buildQuery(emptyState())).toBe('');
  });

  it('keeps commas readable but escapes the values themselves', () => {
    const query = buildQuery({
      ...emptyState(),
      technologies: ['Vue.js', 'Django Rest Framework'],
    });
    expect(query).toBe('technologies=Vue.js,Django+Rest+Framework');
    // and it must survive a round trip
    expect(parseQuery(query).technologies).toEqual(['Vue.js', 'Django Rest Framework']);
  });

  it('escapes characters that would otherwise break the query string', () => {
    const query = buildQuery(setSearch(emptyState(), 'a&b=c'));
    expect(query).toBe('search=a%26b%3Dc');
    expect(parseQuery(query).search).toBe('a&b=c');
  });

  it('preserves an explicit ordering alongside a search', () => {
    // Dropping `-id` here would re-parse as `relevance` and silently reorder.
    const state = { ...setSearch(emptyState(), 'pos'), ordering: '-id' as const };
    expect(buildQuery(state)).toBe('search=pos&ordering=-id');
    expect(parseQuery(buildQuery(state)).ordering).toBe('-id');
  });

  it('never writes relevance ordering, since a search implies it', () => {
    expect(buildQuery({ ...emptyState(), search: 'pos', ordering: 'relevance' })).toBe(
      'search=pos',
    );
  });

  it('round-trips a fully populated state', () => {
    const state = {
      ...emptyState(),
      search: 'management',
      technologies: ['django'],
      categories: ['saas'],
      ordering: 'name' as const,
      page: 3,
      pageSize: 24,
    };
    expect(parseQuery(buildQuery(state))).toEqual(state);
  });
});

describe('toggleFacet', () => {
  it('resets to page 1 — the old site left you stranded on a page that no longer existed', () => {
    const state = { ...emptyState(), page: 5 };
    expect(toggleFacet(state, 'technologies', 'django').page).toBe(1);
  });

  it('adds then removes', () => {
    const added = toggleFacet(emptyState(), 'technologies', 'django');
    expect(added.technologies).toEqual(['django']);
    expect(toggleFacet(added, 'technologies', 'django').technologies).toEqual([]);
  });
});

describe('filterSignature', () => {
  it('ignores page so paging does not look like a new filter', () => {
    const a = { ...emptyState(), page: 1 };
    const b = { ...emptyState(), page: 4 };
    expect(filterSignature(a)).toBe(filterSignature(b));
  });

  it('ignores facet ordering so selection order does not matter', () => {
    const a = { ...emptyState(), technologies: ['django', 'vue-js'] };
    const b = { ...emptyState(), technologies: ['vue-js', 'django'] };
    expect(filterSignature(a)).toBe(filterSignature(b));
  });

  it('changes when the result set would change', () => {
    expect(filterSignature(emptyState())).not.toBe(
      filterSignature({ ...emptyState(), technologies: ['django'] }),
    );
  });
});
