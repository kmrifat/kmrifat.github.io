/**
 * Single source of truth for the shape of synced content.
 *
 * Deliberately plain `.mjs` rather than `.ts` so that the Node sync script and
 * Astro's content config can import the *same* schema objects without a build
 * step. TypeScript still gets full types via `z.infer` in src/lib/types.ts.
 */
import { z } from 'zod';

/** A taxonomy term (technology, category, third-party API, or tag). */
export const facetTermSchema = z.object({
  id: z.number().int(),
  /** Display name exactly as authored in Django admin, e.g. "Vue.js". */
  name: z.string().min(1),
  /** URL-safe form, e.g. "vue-js". */
  slug: z.string().min(1),
});

/** A taxonomy term plus how many projects carry it. */
export const facetTermWithCountSchema = facetTermSchema.extend({
  count: z.number().int().nonnegative(),
});

export const facetGroupsSchema = z.object({
  technologies: z.array(facetTermWithCountSchema),
  categories: z.array(facetTermWithCountSchema),
  apis: z.array(facetTermWithCountSchema),
  tags: z.array(facetTermWithCountSchema),
});

/** Keys of `facetGroupsSchema`, in the order the filter sidebar renders them. */
export const FACET_KEYS = /** @type {const} */ (['technologies', 'categories', 'apis', 'tags']);

/**
 * Every image is optional and may be absent.
 *
 * At the time of writing, all 16 feature images and every screenshot return 404
 * from the Django host, so `status: "missing"` is the common case rather than an
 * edge case. `src` is a path relative to `src/assets/`, resolved to an
 * ImageMetadata at render time.
 */
export const imageRefSchema = z.object({
  src: z.string().nullable(),
  status: z.enum(['ok', 'missing', 'none']),
  /** Original remote URL, kept for debugging and for retrying later. */
  origin: z.string().nullable(),
  alt: z.string().default(''),
});

export const projectButtonSchema = z.object({
  title: z.string().min(1),
  url: z.string().min(1),
  /** True when the URL is still plain http:// — rendered with a warning affordance. */
  insecure: z.boolean().default(false),
});

export const projectSectionSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
});

export const screenshotSchema = z.object({
  image: imageRefSchema,
  title: z.string().nullable(),
});

export const projectSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  slug: z.string().min(1),
  shortDescription: z.string().nullable(),
  description: z.string().nullable(),

  featureImage: imageRefSchema,
  videoUrl: z.string().nullable(),
  /** Parsed from `videoUrl`; null when absent or unparseable. */
  youtubeId: z.string().nullable(),

  features: z.array(projectSectionSchema),
  contexts: z.array(projectSectionSchema),
  screenshots: z.array(screenshotSchema),
  buttons: z.array(projectButtonSchema),

  technologies: z.array(facetTermSchema),
  categories: z.array(facetTermSchema),
  apis: z.array(facetTermSchema),
  tags: z.array(facetTermSchema),

  /**
   * Lowercased haystack of name + short description + feature titles, mirroring
   * the server's `search_fields`. Precomputed so the client never re-lowercases
   * on every keystroke.
   */
  searchBlob: z.string(),
});

export const projectsFileSchema = z.array(projectSchema).min(1);

export const syncMetaSchema = z.object({
  syncedAt: z.string(),
  apiBase: z.string(),
  projectCount: z.number().int().positive(),
  imagesOk: z.number().int().nonnegative(),
  imagesMissing: z.number().int().nonnegative(),
  warnings: z.array(z.string()),
});

/* ------------------------------------------------------------ open source --- */

/** A public repository, synced from the GitHub API at build time. */
export const repoSchema = z.object({
  name: z.string(),
  fullName: z.string(),
  owner: z.string(),
  url: z.string().url(),
  homepage: z.string().nullable(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  topics: z.array(z.string()).default([]),
  stars: z.number().int().nonnegative(),
  forks: z.number().int().nonnegative(),
  createdAt: z.string(),
  pushedAt: z.string(),
});

export const reposFileSchema = z.array(repoSchema);

/* --------------------------------------------------------------- journey --- */

const dateish = z
  .string()
  .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'expected YYYY, YYYY-MM, or YYYY-MM-DD');

/**
 * A single entry on the journey timeline.
 *
 * Authored by hand as Markdown in src/content/journey/. The Markdown body becomes
 * the expandable detail; everything structural lives in frontmatter so the 3D
 * scene can read it without parsing prose.
 */
export const journeyEntrySchema = z.object({
  kind: z.enum(['education', 'work', 'milestone', 'project', 'award', 'talk']),
  title: z.string().min(1),
  org: z
    .object({
      name: z.string().min(1),
      url: z.string().url().optional(),
    })
    .optional(),
  location: z
    .object({
      city: z.string().optional(),
      country: z.string().optional(),
      remote: z.boolean().default(false),
    })
    .optional(),

  start: dateish,
  /** `null` means a point-in-time event rather than a span. */
  end: z.union([dateish, z.literal('present'), z.null()]).default(null),

  /** One sentence. Used as the sticky caption beside the 3D scene. */
  summary: z.string().min(1).max(220),
  highlights: z.array(z.string()).default([]),

  /** Cross-links into the project catalogue. */
  tech: z.array(z.string()).default([]),
  projectSlugs: z.array(z.string()).default([]),

  links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),

  /** Node colour in the 3D scene. */
  accent: z.enum(['brand', 'accent', 'neutral']).default('neutral'),
  /** Manual ordering override; otherwise entries sort by `start`. */
  order: z.number().optional(),
  featured: z.boolean().default(false),
  /**
   * Entries derived from project data rather than confirmed by Rifat.
   * Rendered with a visible "unverified" affordance and excluded from JSON-LD,
   * because asserting an unverified employment history would be worse than
   * saying nothing.
   */
  draft: z.boolean().default(false),
});
