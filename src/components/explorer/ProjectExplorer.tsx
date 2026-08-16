import { useCallback, useMemo, useRef } from 'react';
import { applyFilters, facetCounts } from '../../lib/filter';
import { emptyState, hasActiveFilters, setSearch, toggleFacet } from '../../lib/query-state';
import { cardStyles } from '../../lib/card-styles';
import {
  FACET_KEYS,
  ORDERINGS,
  type FacetGroups,
  type FacetKey,
  type Ordering,
  type Project,
} from '../../lib/types';
import type { ResolvedCardImage } from '../../lib/resolve-images';
import { useUrlState } from './useUrlState';
import { FilterPanel } from './FilterPanel';
import { Pagination } from './Pagination';
import { ResultCard } from './ResultCard';

interface Props {
  projects: Project[];
  facets: FacetGroups;
  images: Record<string, ResolvedCardImage | null>;
}

export default function ProjectExplorer({ projects, facets, images }: Props) {
  const { state, update } = useUrlState();
  const resultsRef = useRef<HTMLDivElement>(null);

  // 16 projects — filtering is a few microseconds of array work, so there is no
  // request, no debounce between typing and results, and no loading state.
  const result = useMemo(() => applyFilters(projects, state), [projects, state]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FACET_KEYS.map((key) => [key, facetCounts(projects, state, key)]),
      ) as Record<FacetKey, Map<string, number>>,
    [projects, state],
  );

  const isFiltered = hasActiveFilters(state);

  /**
   * Bring the results into view after a change that reorders them — but only if
   * they have scrolled off the top. Yanking the viewport of someone who is
   * already looking at the grid would be worse than doing nothing.
   */
  const revealResults = useCallback(() => {
    const node = resultsRef.current;
    if (!node) return;
    if (node.getBoundingClientRect().top < 0) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const onToggle = useCallback(
    (key: FacetKey, slug: string) => {
      update((previous) => toggleFacet(previous, key, slug));
      revealResults();
    },
    [update, revealResults],
  );

  const onClear = useCallback(() => {
    update(() => emptyState());
    revealResults();
  }, [update, revealResults]);

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <FilterPanel
          facets={facets}
          state={state}
          counts={counts}
          onToggle={onToggle}
          onClear={onClear}
          hasFilters={isFiltered}
        />
      </aside>

      <div ref={resultsRef}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="project-search" className="sr-only">
              Search projects
            </label>
            <input
              id="project-search"
              type="search"
              value={state.search}
              onChange={(event) => update((previous) => setSearch(previous, event.target.value))}
              placeholder="Search projects, features…"
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-3.5 py-2.5 text-sm placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div>
            <label htmlFor="project-ordering" className="sr-only">
              Sort projects
            </label>
            <select
              id="project-ordering"
              value={state.ordering === 'relevance' ? '' : state.ordering}
              onChange={(event) =>
                update((previous) => ({
                  ...previous,
                  ordering: (event.target.value || 'relevance') as Ordering,
                  page: 1,
                }))
              }
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-3 py-2.5 text-sm"
            >
              {state.search.trim() && <option value="">Most relevant</option>}
              {ORDERINGS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/*
          Announced politely so screen-reader users learn the result count changed
          without the grid stealing focus on every keystroke.
        */}
        <p className="mt-4 text-sm text-[var(--text-muted)]" aria-live="polite" data-result-count>
          {result.total === projects.length && !isFiltered
            ? `Showing all ${projects.length} projects`
            : `${result.total} ${result.total === 1 ? 'project matches' : 'projects match'}`}
        </p>

        {result.total === 0 ? (
          <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-[var(--border-subtle)] p-10 text-center">
            <p className="font-medium">No projects match these filters</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Try removing a filter or searching for something broader.
            </p>
            <button
              type="button"
              onClick={onClear}
              className="mt-5 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className={`mt-5 ${cardStyles.grid}`} data-project-grid>
            {result.items.map((project, index) => (
              <ResultCard
                key={project.slug}
                project={project}
                image={images[project.slug] ?? null}
                eager={index < 3}
              />
            ))}
          </div>
        )}

        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          onChange={(page) => {
            update((previous) => ({ ...previous, page }));
            revealResults();
          }}
        />
      </div>
    </div>
  );
}
