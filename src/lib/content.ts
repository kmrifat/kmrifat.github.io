import { getCollection } from 'astro:content';
import facetsJson from '../data/facets.json';
import syncMeta from '../data/sync-meta.json';
import type { FacetGroups, FacetKey, Project } from './types';

/** Facet terms with their catalogue-wide counts, written by `npm run sync`. */
export const facets = facetsJson as FacetGroups;

export const lastSyncedAt = (syncMeta as { syncedAt: string }).syncedAt;

/**
 * Every active project, newest first.
 *
 * Ordering matches the API's `Meta.ordering = ['-id']`, so the default view here
 * is the same one the old site showed.
 */
export async function getProjects(): Promise<Project[]> {
  const entries = await getCollection('projects');
  return entries.map((entry) => entry.data as Project).sort((a, b) => b.id - a.id);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  return (await getProjects()).find((project) => project.slug === slug);
}

/** Looks up a facet term by slug, for rendering landing-page titles. */
export function findTerm(key: FacetKey, slug: string) {
  return facets[key].find((term) => term.slug === slug);
}

/** Terms that at least one project carries — the only ones worth a landing page. */
export function usedTerms(key: FacetKey) {
  return facets[key].filter((term) => term.count > 0);
}
