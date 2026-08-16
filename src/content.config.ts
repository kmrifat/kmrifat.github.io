import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';

import { projectSchema, journeyEntrySchema } from './lib/schemas.mjs';

/**
 * Projects come from the committed snapshot written by `npm run sync`.
 *
 * Routing this through a collection rather than importing the JSON directly buys
 * a second validation gate: if the snapshot is ever hand-edited into an invalid
 * shape, the build fails loudly here instead of rendering a subtly broken page.
 */
const projects = defineCollection({
  loader: file('src/data/projects.json', {
    // Keyed by slug so `entry.id` is the URL segment, while `entry.data.id`
    // keeps the numeric database id used for chronological ordering.
    parser: (text) =>
      Object.fromEntries(
        (JSON.parse(text) as Array<{ slug: string }>).map((project) => [project.slug, project]),
      ),
  }),
  schema: projectSchema,
});

/** Hand-authored journey entries. The Markdown body renders as expandable detail. */
const journey = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journey' }),
  schema: journeyEntrySchema,
});

export const collections = { projects, journey };
