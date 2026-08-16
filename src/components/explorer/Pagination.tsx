interface Props {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

/**
 * Builds a page list with ellipses: 1 … 4 5 6 … 12
 * Always shows first and last so the ends stay reachable in one click.
 */
function pageRange(page: number, pageCount: number, window = 1): Array<number | '…'> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const pages = new Set<number>([1, pageCount]);
  for (let p = page - window; p <= page + window; p += 1) {
    if (p > 1 && p < pageCount) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | '…'> = [];

  for (const [index, value] of sorted.entries()) {
    if (index > 0 && value - (sorted[index - 1] as number) > 1) out.push('…');
    out.push(value);
  }

  return out;
}

export function Pagination({ page, pageCount, onChange }: Props) {
  if (pageCount <= 1) return null;

  const buttonClass =
    'grid h-9 min-w-9 place-items-center rounded-lg border border-[var(--border-subtle)] px-2.5 text-sm transition-colors hover:border-[var(--brand)] disabled:opacity-40 disabled:hover:border-[var(--border-subtle)]';

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        ←
      </button>

      {pageRange(page, pageCount).map((entry, index) =>
        entry === '…' ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-[var(--text-muted)]">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onChange(entry)}
            aria-current={entry === page ? 'page' : undefined}
            aria-label={`Page ${entry}`}
            className={`${buttonClass} ${
              entry === page ? 'border-[var(--brand)] font-semibold text-[var(--brand)]' : ''
            }`}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Next page"
      >
        →
      </button>
    </nav>
  );
}
