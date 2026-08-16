import type { z } from 'zod';
import type {
  projectSchema,
  facetTermSchema,
  facetTermWithCountSchema,
  facetGroupsSchema,
  imageRefSchema,
  journeyEntrySchema,
} from './schemas.mjs';

export type Project = z.infer<typeof projectSchema>;
export type FacetTerm = z.infer<typeof facetTermSchema>;
export type FacetTermWithCount = z.infer<typeof facetTermWithCountSchema>;
export type FacetGroups = z.infer<typeof facetGroupsSchema>;
export type ImageRef = z.infer<typeof imageRefSchema>;
export type JourneyEntry = z.infer<typeof journeyEntrySchema>;

/** The four filterable taxonomies, in sidebar render order. */
export type FacetKey = 'technologies' | 'categories' | 'apis' | 'tags';

export const FACET_KEYS: readonly FacetKey[] = ['technologies', 'categories', 'apis', 'tags'];

/** Human labels and URL segments for each facet, used by the sidebar and landing pages. */
export const FACET_META: Record<FacetKey, { label: string; singular: string; segment: string }> = {
  technologies: { label: 'Technology', singular: 'technology', segment: 'tech' },
  categories: { label: 'Category', singular: 'category', segment: 'category' },
  apis: { label: 'Integration', singular: 'integration', segment: 'api' },
  tags: { label: 'Tag', singular: 'tag', segment: 'tag' },
};

/** Sort orders exposed in the URL as `?ordering=`. */
export type Ordering = '-id' | 'id' | 'name' | '-name' | 'relevance';

export const ORDERINGS: ReadonlyArray<{ value: Ordering; label: string }> = [
  { value: '-id', label: 'Newest first' },
  { value: 'id', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: '-name', label: 'Name Z–A' },
];

export const DEFAULT_ORDERING: Ordering = '-id';

/**
 * Deliberately larger than the catalogue (16 projects today).
 *
 * The island is server-rendered, so whatever the first page shows is what ends
 * up in the static HTML that crawlers and no-JS visitors get. A default of 12
 * would silently drop 4 projects out of that HTML — pages 2+ only exist once
 * JavaScript runs. Showing everything on one page keeps the static document
 * complete, and pagination still engages automatically if the catalogue grows
 * past this number or the visitor passes an explicit `?page_size=`.
 */
export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;
