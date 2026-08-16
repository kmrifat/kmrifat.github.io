import { describe, expect, it, beforeAll } from 'vitest';
import { applyFilters, filterProjects } from './filter';
import { emptyState } from './query-state';
import projectsJson from '../data/projects.json';
import type { Project } from './types';

/**
 * Parity check: client-side filtering must return exactly what the Django API
 * would have returned.
 *
 * Moving filtering into the browser is only safe if it reproduces the server's
 * semantics — OR within a facet, AND across facets. This suite asserts that
 * against the live API, so a divergence shows up as a failing test rather than
 * as quietly wrong results on the site.
 *
 * Network-dependent by nature. Skipped automatically when the API is
 * unreachable, so it never breaks an offline build. Run explicitly with:
 *   npx vitest run src/lib/filter.parity.test.ts
 */
const API = process.env.API_BASE ?? 'https://kmrifat.binarycastle.net/api';
const projects = projectsJson as unknown as Project[];

/** Django ORM lookup path for each facet, as used by django_ufilter. */
const LOOKUP = {
  technologies: 'projecttechnology__technology__name__in',
  categories: 'projectcategory__category__name__in',
  apis: 'projectapi__api__name__in',
  tags: 'projecttag__tag__name__in',
} as const;

async function serverCount(params: Record<string, string>): Promise<number> {
  const query = new URLSearchParams(params).toString().replace(/%2C/g, ',');
  const response = await fetch(`${API}/portfolio/projects/?${query}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()).count;
}

let online = false;
beforeAll(async () => {
  try {
    await serverCount({ page_size: '1' });
    online = true;
  } catch {
    console.warn('  API unreachable — parity tests skipped.');
  }
});

const localCount = (state: Partial<ReturnType<typeof emptyState>>) =>
  filterProjects(projects, { ...emptyState(), ...state }).length;

describe('filter parity with the Django API', () => {
  it('agrees on the unfiltered total', async ({ skip }) => {
    if (!online) skip();
    expect(localCount({})).toBe(await serverCount({ page_size: '1000' }));
  });

  it('agrees on a single technology', async ({ skip }) => {
    if (!online) skip();
    expect(localCount({ technologies: ['Django'] })).toBe(
      await serverCount({ [LOOKUP.technologies]: 'Django', page_size: '1000' }),
    );
  });

  it('ORs within a facet (Django OR Vue.js)', async ({ skip }) => {
    if (!online) skip();
    const local = localCount({ technologies: ['Django', 'Vue.js'] });
    expect(local).toBe(
      await serverCount({ [LOOKUP.technologies]: 'Django,Vue.js', page_size: '1000' }),
    );
    // Established baseline from the planning phase.
    expect(local).toBe(13);
  });

  it('ANDs across facets (Laravel AND E-Commerce)', async ({ skip }) => {
    if (!online) skip();
    expect(localCount({ technologies: ['Laravel'], categories: ['E-Commerce'] })).toBe(
      await serverCount({
        [LOOKUP.technologies]: 'Laravel',
        [LOOKUP.categories]: 'E-Commerce',
        page_size: '1000',
      }),
    );
  });

  it('agrees across a matrix of facet combinations', async ({ skip }) => {
    if (!online) skip();

    const cases = [
      { technologies: ['Python'] },
      { technologies: ['Django', 'Laravel'] },
      { categories: ['SaaS'] },
      { categories: ['Medical Software', 'LMS'] },
      { apis: ['Stripe'] },
      { apis: ['Stripe', 'Paypal'] },
      { technologies: ['Vue.js'], categories: ['SaaS'] },
      { technologies: ['Django'], apis: ['Google Auth'] },
      { technologies: ['Nonexistent Tech'] },
    ];

    for (const scenario of cases) {
      const params: Record<string, string> = { page_size: '1000' };
      for (const [key, values] of Object.entries(scenario)) {
        params[LOOKUP[key as keyof typeof LOOKUP]] = (values as string[]).join(',');
      }

      expect(localCount(scenario), `mismatch for ${JSON.stringify(scenario)}`).toBe(
        await serverCount(params),
      );
    }
  });

  it('matches slugs and display names identically', async ({ skip }) => {
    if (!online) skip();
    expect(localCount({ technologies: ['vue-js'] })).toBe(localCount({ technologies: ['Vue.js'] }));
  });

  it('reproduces the server search across name, description and feature titles', async ({
    skip,
  }) => {
    if (!online) skip();
    for (const term of ['management', 'pos', 'social']) {
      expect(localCount({ search: term }), `search "${term}"`).toBe(
        await serverCount({ search: term, page_size: '1000' }),
      );
    }
  });
});

describe('pagination', () => {
  it('clamps an out-of-range page to the last page instead of rendering nothing', () => {
    const result = applyFilters(projects, { ...emptyState(), page: 99 });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.page).toBe(result.pageCount);
  });

  it('paginates without dropping or duplicating a project', () => {
    const seen = new Set<string>();
    const first = applyFilters(projects, { ...emptyState(), pageSize: 5, page: 1 });

    for (let page = 1; page <= first.pageCount; page += 1) {
      for (const project of applyFilters(projects, { ...emptyState(), pageSize: 5, page }).items) {
        expect(seen.has(project.slug), `duplicate ${project.slug}`).toBe(false);
        seen.add(project.slug);
      }
    }

    expect(seen.size).toBe(projects.length);
  });
});
