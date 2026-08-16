import { memo } from 'react';
import { cardStyles, MAX_CARD_CHIPS } from '../../lib/card-styles';
import { placeholderFor } from '../../lib/placeholder';
import type { Project } from '../../lib/types';
import type { ResolvedCardImage } from '../../lib/resolve-images';

interface Props {
  project: Project;
  image: ResolvedCardImage | null;
  eager: boolean;
}

/**
 * React twin of ProjectCard.astro. Both pull their class strings from
 * card-styles.ts so the two renderings cannot drift visually.
 *
 * Memoised because filtering re-renders the list on every keystroke; without it
 * all 16 cards would reconcile each time for no reason.
 */
function ResultCardImpl({ project, image, eager }: Props) {
  const placeholder = placeholderFor(project.slug, project.name);
  const chips = project.technologies.slice(0, MAX_CARD_CHIPS);
  const overflow = project.technologies.length - chips.length;

  return (
    <article
      className={cardStyles.article}
      data-project={project.slug}
      data-technologies={project.technologies.map((t) => t.slug).join(' ')}
      data-categories={project.categories.map((t) => t.slug).join(' ')}
      data-apis={project.apis.map((t) => t.slug).join(' ')}
      data-tags={project.tags.map((t) => t.slug).join(' ')}
    >
      <div className={cardStyles.mediaWrap}>
        {image ? (
          <img
            src={image.src}
            srcSet={image.srcset}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            width={image.width}
            height={image.height}
            alt={project.featureImage.alt || project.name}
            loading={eager ? 'eager' : 'lazy'}
            decoding={eager ? 'sync' : 'async'}
            className="size-full object-cover"
          />
        ) : (
          <div
            className="grid size-full place-items-center"
            style={{ backgroundImage: placeholder.background }}
            aria-hidden="true"
          >
            <span className="text-4xl font-bold tracking-tight text-white/90 drop-shadow-sm">
              {placeholder.initials}
            </span>
          </div>
        )}
      </div>

      <div className={cardStyles.body}>
        <h3 className={cardStyles.title}>
          <a href={`/projects/${project.slug}/`} className={cardStyles.titleLink}>
            {project.name}
          </a>
        </h3>

        {project.shortDescription && (
          <p className={cardStyles.description}>{project.shortDescription}</p>
        )}

        {chips.length > 0 && (
          <ul className={cardStyles.chipRow}>
            {chips.map((tech) => (
              <li key={tech.slug} className={cardStyles.chip}>
                {tech.name}
              </li>
            ))}
            {overflow > 0 && <li className={cardStyles.chipMore}>+{overflow}</li>}
          </ul>
        )}
      </div>
    </article>
  );
}

export const ResultCard = memo(ResultCardImpl);
