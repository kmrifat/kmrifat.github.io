/**
 * Class strings shared between ProjectCard.astro (static render) and
 * ResultCard.tsx (the React island).
 *
 * These two components must produce identical markup: the island replaces the
 * statically rendered grid in place, and any drift shows up as a visible jump on
 * hydration. Keeping the strings here means they cannot diverge silently.
 */
export const cardStyles = {
  article:
    'group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] transition-shadow duration-200 hover:shadow-lg',
  mediaWrap: 'relative aspect-[16/10] overflow-hidden bg-[var(--surface-sunken)]',
  body: 'flex flex-1 flex-col p-5',
  title: 'text-lg leading-snug font-semibold tracking-tight',
  titleLink: 'after:absolute after:inset-0 focus:outline-none',
  description: 'mt-2 line-clamp-2 text-sm text-[var(--text-muted)]',
  chipRow: 'mt-4 flex flex-wrap gap-1.5',
  chip: 'rounded-md bg-[var(--surface-sunken)] px-2 py-1 text-xs font-medium text-[var(--text-muted)]',
  chipMore: 'px-1 py-1 text-xs text-[var(--text-muted)]',
  grid: 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3',
} as const;

/** Number of technology chips shown on a card before collapsing to "+N". */
export const MAX_CARD_CHIPS = 3;
