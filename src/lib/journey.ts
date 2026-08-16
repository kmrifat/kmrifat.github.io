import { getCollection, type CollectionEntry } from 'astro:content';

export type JourneyItem = CollectionEntry<'journey'>;

/** Sortable numeric key from a `YYYY`, `YYYY-MM`, or `YYYY-MM-DD` string. */
function dateKey(value: string): number {
  const [year, month = '01', day = '01'] = value.split('-');
  return Number(`${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`);
}

/** Chronological, oldest first — the order the timeline is scrolled through. */
export async function getJourney(): Promise<JourneyItem[]> {
  const entries = await getCollection('journey');

  return entries.sort((a, b) => {
    if (a.data.order !== undefined && b.data.order !== undefined) {
      return a.data.order - b.data.order;
    }
    return dateKey(a.data.start) - dateKey(b.data.start);
  });
}

/**
 * Human-readable span.
 *
 * Draft entries get a "c." prefix, because their dates are inferred from
 * catalogue ordering rather than confirmed — presenting a guess as a fact would
 * be worse than showing nothing.
 */
export function formatRange(entry: JourneyItem['data']): string {
  const year = (value: string) => value.split('-')[0]!;
  const prefix = entry.draft ? 'c. ' : '';

  const start = `${prefix}${year(entry.start)}`;
  if (!entry.end) return start;
  if (entry.end === 'present') return `${start} — present`;

  const endYear = year(entry.end);
  return endYear === year(entry.start) ? start : `${start} — ${endYear}`;
}

/** Tailwind classes per entry kind, used for the node dot and label. */
export const KIND_STYLES: Record<string, { label: string; dot: string }> = {
  education: { label: 'Education', dot: 'bg-ink-400' },
  work: { label: 'Work', dot: 'bg-brand-500' },
  milestone: { label: 'Milestone', dot: 'bg-accent-500' },
  project: { label: 'Project', dot: 'bg-brand-400' },
  award: { label: 'Award', dot: 'bg-accent-400' },
  talk: { label: 'Talk', dot: 'bg-ink-500' },
};

/** Normalised 0–1 position of each entry along the timeline, for the 3D scene. */
export function journeyPositions(entries: JourneyItem[]): number[] {
  if (entries.length <= 1) return entries.map(() => 0);
  return entries.map((_, index) => index / (entries.length - 1));
}
