import { SITE, confirmedSocialUrls, EMAIL } from './site';
import type { JourneyItem } from './journey';
import type { Project } from './types';

/**
 * Structured data.
 *
 * Without `offers` or `aggregateRating` none of this produces star-style rich
 * results — the value is entity understanding: letting a search engine connect
 * the person, the site, and the work into one graph.
 */
const PERSON_ID = `${SITE.url}/#person`;
const SITE_ID = `${SITE.url}/#website`;

export function personSchema(technologies: string[] = []) {
  const sameAs = confirmedSocialUrls();

  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: SITE.name,
    url: `${SITE.url}/`,
    jobTitle: SITE.role,
    description: SITE.description,
    email: `mailto:${EMAIL}`,
    ...(technologies.length > 0 && { knowsAbout: technologies }),
    // Only profiles confirmed to belong to Rifat — an incorrect `sameAs` asserts
    // a false identity link, which is worse than omitting it.
    ...(sameAs.length > 0 && { sameAs }),
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: `${SITE.url}/`,
    name: SITE.name,
    publisher: { '@id': PERSON_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE.url}/projects/?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Chooses the most accurate type for a given project. */
function projectType(project: Project): string {
  const categories = project.categories.map((c) => c.slug);
  // Crawlers, packages and libraries are not applications.
  if (categories.some((c) => ['crawling', 'package-development'].includes(c))) {
    return 'SoftwareSourceCode';
  }
  return 'SoftwareApplication';
}

export function projectSchema(project: Project) {
  const type = projectType(project);
  const demo = project.buttons.find((b) => /demo|live|site/i.test(b.title));

  return {
    '@type': type,
    name: project.name,
    url: `${SITE.url}/projects/${project.slug}/`,
    description: project.shortDescription ?? project.description ?? undefined,
    author: { '@id': PERSON_ID },
    mainEntityOfPage: `${SITE.url}/projects/${project.slug}/`,
    ...(project.technologies.length > 0 && {
      // `programmingLanguage` for source, `applicationCategory` for apps.
      ...(type === 'SoftwareSourceCode'
        ? { programmingLanguage: project.technologies.map((t) => t.name) }
        : {
            applicationCategory: project.categories[0]?.name ?? 'WebApplication',
            operatingSystem: 'Web',
          }),
    }),
    ...(demo && { sameAs: demo.url }),
    keywords: [...project.technologies, ...project.categories].map((t) => t.name).join(', '),
  };
}

export function itemListSchema(projects: Project[], listUrl: string) {
  return {
    '@type': 'ItemList',
    url: listUrl,
    numberOfItems: projects.length,
    itemListElement: projects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE.url}/projects/${project.slug}/`,
      name: project.name,
    })),
  };
}

/**
 * Work history from journey entries.
 *
 * Draft entries are excluded on purpose: their dates and employers were inferred
 * from project ordering, and publishing an unverified employment history as
 * machine-readable fact is exactly the kind of claim that should not be asserted.
 */
export function profilePageSchema(entries: JourneyItem[]) {
  const confirmed = entries.filter((entry) => !entry.data.draft);

  return {
    '@type': 'ProfilePage',
    url: `${SITE.url}/about/`,
    mainEntity: {
      '@id': PERSON_ID,
      ...(confirmed.some((e) => e.data.kind === 'work') && {
        hasOccupation: confirmed
          .filter((entry) => entry.data.kind === 'work')
          .map((entry) => ({
            '@type': 'Occupation',
            name: entry.data.title,
            ...(entry.data.org && { hiringOrganization: entry.data.org.name }),
          })),
      }),
      ...(confirmed.some((e) => e.data.kind === 'education') && {
        alumniOf: confirmed
          .filter((entry) => entry.data.kind === 'education' && entry.data.org)
          .map((entry) => ({
            '@type': 'EducationalOrganization',
            name: entry.data.org!.name,
          })),
      }),
    },
  };
}

/** Wraps nodes into a single @graph document. */
export function graph(...nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
