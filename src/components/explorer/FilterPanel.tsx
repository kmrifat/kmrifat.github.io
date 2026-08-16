import type { FilterState } from '../../lib/filter';
import { FACET_META, FACET_KEYS, type FacetGroups, type FacetKey } from '../../lib/types';

interface Props {
  facets: FacetGroups;
  state: FilterState;
  /** Result count per term slug, given the *other* active filters. */
  counts: Record<FacetKey, Map<string, number>>;
  onToggle: (key: FacetKey, slug: string) => void;
  onClear: () => void;
  hasFilters: boolean;
}

export function FilterPanel({ facets, state, counts, onToggle, onClear, hasFilters }: Props) {
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide uppercase">Filters</h2>
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-[var(--brand)] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {FACET_KEYS.map((key) => {
        const terms = facets[key].filter((term) => term.count > 0);
        if (terms.length === 0) return null;

        // Selection can be by slug or by legacy display name, so compare both.
        const selected = new Set(state[key].map((value) => value.toLowerCase()));

        return (
          <fieldset key={key} className="border-0 p-0">
            <legend className="text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
              {FACET_META[key].label}
            </legend>

            <ul className="mt-2.5 max-h-64 space-y-0.5 overflow-y-auto pr-1">
              {terms.map((term) => {
                const isChecked = selected.has(term.slug) || selected.has(term.name.toLowerCase());
                const available = counts[key].get(term.slug) ?? 0;
                // Disable options that would produce nothing — but never disable
                // one that is currently checked, or it could not be unchecked.
                const isDisabled = available === 0 && !isChecked;

                return (
                  <li key={term.slug}>
                    <label
                      className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--surface-sunken)] ${
                        isDisabled ? 'cursor-not-allowed opacity-40' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isDisabled}
                        onChange={() => onToggle(key, term.slug)}
                        className="size-4 shrink-0 accent-[var(--brand)]"
                      />
                      <span className="flex-1 truncate">{term.name}</span>
                      <span className="shrink-0 text-xs text-[var(--text-muted)] tabular-nums">
                        {available}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      })}
    </div>
  );
}
