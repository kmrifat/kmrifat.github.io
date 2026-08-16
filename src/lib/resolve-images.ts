import { getImage } from 'astro:assets';
import type { Project } from './types';

/**
 * Pre-resolves optimised image URLs for the React island.
 *
 * Astro's `<Image>` only works inside `.astro` files, so the island cannot
 * optimise images itself. Instead we run the optimiser here at build time and
 * hand the island plain URLs — it never needs to know about the asset pipeline.
 */
export interface ResolvedCardImage {
  src: string;
  srcset: string;
  width: number;
  height: number;
}

const localImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/remote/**/*.{png,jpg,jpeg,webp,avif,gif}',
);

export async function resolveCardImages(
  projects: Project[],
): Promise<Record<string, ResolvedCardImage | null>> {
  const entries = await Promise.all(
    projects.map(async (project) => {
      const path = project.featureImage.src;
      const loader = path ? localImages[`/src/assets/${path}`] : undefined;

      // No image on disk — the island falls back to the generated placeholder.
      if (!loader) return [project.slug, null] as const;

      const source = (await loader()).default;
      const optimised = await getImage({
        src: source,
        widths: [400, 800, 1200],
        format: 'webp',
      });

      return [
        project.slug,
        {
          src: optimised.src,
          srcset: optimised.srcSet.attribute,
          width: optimised.options.width ?? source.width,
          height: optimised.options.height ?? source.height,
        },
      ] as const;
    }),
  );

  return Object.fromEntries(entries);
}
