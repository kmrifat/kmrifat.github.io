/**
 * Deterministic placeholder artwork for projects whose image is unavailable.
 *
 * Every image on the Django host currently 404s, so this is what most visitors
 * actually see. The goal is for it to read as a deliberate design choice rather
 * than as a broken image: a stable gradient derived from the project slug, plus
 * the project's initials.
 *
 * Deriving the hue from the slug means a given project always gets the same
 * colour — across rebuilds, and between the static card and the island's card.
 */
/**
 * Two tight hue families rather than one continuous range.
 *
 * Interpolating from orange (16°) to teal (168°) sweeps through yellow and
 * green, which reads as a random palette instead of a brand. Sampling within a
 * narrow band around each brand colour keeps a wall of placeholders recognisably
 * "this site".
 */
const FAMILIES = [
  { hue: 14, spread: 12, sat: 78, light: 44 }, // around #FF4500
  { hue: 168, spread: 14, sat: 74, light: 34 }, // around #00A887
] as const;

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export interface Placeholder {
  /** Ready-to-use CSS `background-image` value. */
  background: string;
  initials: string;
}

export function placeholderFor(slug: string, name: string): Placeholder {
  const seed = hash(slug);

  const family = FAMILIES[seed % FAMILIES.length]!;
  // Offset within the family band, deterministic per slug.
  const drift = ((seed >> 3) % (family.spread * 2)) - family.spread;
  const hue = family.hue + drift;
  const angle = 125 + ((seed >> 7) % 5) * 12;

  const from = `hsl(${hue} ${family.sat}% ${family.light}%)`;
  // Second stop is darker and slightly rotated, giving depth without a colour shift.
  const to = `hsl(${hue + 10} ${family.sat - 8}% ${family.light - 14}%)`;

  const initials = name
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('');

  return {
    background: `linear-gradient(${angle}deg, ${from}, ${to})`,
    initials: initials || '?',
  };
}
