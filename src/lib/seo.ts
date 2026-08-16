import { SITE } from './site';

export interface SeoInput {
  title?: string;
  description?: string;
  /** Absolute or site-relative OG image URL. Defaults to the generated page OG. */
  image?: string;
  /** Set true on redirect stubs and any page that must stay out of the index. */
  noindex?: boolean;
  type?: 'website' | 'article' | 'profile';
}

export interface ResolvedSeo {
  title: string;
  description: string;
  canonical: string;
  image: string;
  noindex: boolean;
  type: NonNullable<SeoInput['type']>;
}

/**
 * Canonical URL for a page.
 *
 * The query string is deliberately dropped: `/projects/?technologies=Django` is a
 * client-side view of the same document, so it must canonicalise to `/projects/`.
 * The pre-rendered facet pages (`/projects/tech/django/`) are what own the
 * indexable facet space instead.
 */
export function canonicalUrl(pageUrl: URL): string {
  const path = pageUrl.pathname.endsWith('/') ? pageUrl.pathname : `${pageUrl.pathname}/`;
  return new URL(path, SITE.url).href;
}

/** Derives the OG image endpoint path that matches a given page path. */
export function ogImageFor(pathname: string): string {
  const clean = pathname.replace(/^\/|\/$/g, '');
  return new URL(`/og/${clean || 'index'}.png`, SITE.url).href;
}

export function resolveSeo(input: SeoInput, pageUrl: URL): ResolvedSeo {
  const canonical = canonicalUrl(pageUrl);
  return {
    title: input.title ? `${input.title} — ${SITE.titleSuffix}` : SITE.titleSuffix,
    description: input.description ?? SITE.description,
    canonical,
    image: input.image ? new URL(input.image, SITE.url).href : ogImageFor(pageUrl.pathname),
    noindex: input.noindex ?? false,
    type: input.type ?? 'website',
  };
}

/** Clamp a description to a length search engines will actually display. */
export function clampDescription(text: string | null | undefined, max = 160): string {
  if (!text) return SITE.description;
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).replace(/[\s,;:.-]+\S*$/, '')}…`;
}
