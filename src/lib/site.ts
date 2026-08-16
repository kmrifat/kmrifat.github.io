import { SITE_URL } from './site-url.mjs';

export { SITE_URL };

export const SITE = {
  url: SITE_URL,
  name: 'K M Rifat Ul Alom',
  shortName: 'K M Rifat',
  titleSuffix: 'K M Rifat Ul Alom',
  /**
   * TODO(rifat): confirm. You were CTO at Mediusware and Tech Lead at Debutify,
   * and now run Binary Castle — so the 2022 CV's "Senior Software Engineer" is
   * out of date. This is my best reading of where you actually are.
   */
  role: 'Technical Lead & Full-stack Engineer',
  description:
    'Ten years building web platforms — medical software, SaaS products and real-time systems in Django and Laravel. Former CTO at Mediusware, Tech Lead at Debutify, now building at Binary Castle.',
  locale: 'en',
  analyticsId: 'G-0V1WVC5SCL',
} as const;

/**
 * Public profiles.
 *
 * `confirmed` gates entry into JSON-LD `sameAs`, which is an identity assertion —
 * only URLs verified to belong to Rifat are listed there.
 *
 * Deliberately excluded from this site: the WhatsApp number, age and citizenship
 * that appear on the CV. A public phone number attracts spam, and age and
 * nationality invite bias without helping anyone evaluate the work.
 */
export const SOCIAL_LINKS: ReadonlyArray<{
  label: string;
  url: string;
  confirmed: boolean;
  /** Shown in the footer and contact block. */
  primary?: boolean;
}> = [
  { label: 'GitHub', url: 'https://github.com/kmrifat', confirmed: true, primary: true },
  {
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/kmrifat/',
    confirmed: true,
    primary: true,
  },
  {
    label: 'CodeCanyon',
    url: 'https://codecanyon.net/user/kmrifat',
    confirmed: true,
    primary: true,
  },
  { label: 'Binary Castle', url: 'https://github.com/binary-castle', confirmed: true },
  { label: 'Email', url: 'mailto:kmrifat@gmail.com', confirmed: false, primary: true },
];

export const EMAIL = 'kmrifat@gmail.com';

/**
 * Only confirmed profile URLs. `mailto:` is filtered out because `sameAs`
 * expects pages that represent the person, not contact methods — email belongs
 * in JSON-LD as `email` instead.
 */
export const confirmedSocialUrls = (): string[] =>
  SOCIAL_LINKS.filter((l) => l.confirmed && !l.url.startsWith('mailto:')).map((l) => l.url);

export const NAV_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'Home', href: '/' },
  { label: 'Journey', href: '/about/' },
  { label: 'Projects', href: '/projects/' },
  { label: 'Open source', href: '/open-source/' },
];

/**
 * The CV.
 *
 * `page` is canonical — generated from src/content/journey/, so it cannot drift
 * from the timeline. `file` is that same page rendered to PDF at build time by
 * scripts/generate-cv-pdf.mjs; if no Chrome binary is available the PDF is
 * simply absent and the page stands on its own.
 *
 * This replaces a hand-maintained April 2022 PDF that ended at CTO at Mediusware
 * and carried a phone number, age and citizenship the site deliberately omits.
 */
export const CV = {
  page: '/cv/',
  file: '/cv/K-M-Rifat-Ul-Alom-CV.pdf',
  filename: 'K-M-Rifat-Ul-Alom-CV.pdf',
} as const;

/**
 * Projects the CV leads with, in order.
 *
 * Chosen by Rifat rather than taken from the catalogue's default recency sort —
 * the newest projects are not the ones worth showing a hiring manager first.
 * Slugs must exist in the Django catalogue; any that don't are reported as a
 * build warning and skipped rather than silently dropped.
 */
export const CV_PROJECT_SLUGS: readonly string[] = [
  'dr-assistant-pro',
  'xzit-social',
  'ar-proactive', // TODO: not in the Django catalogue yet
  'debutify-reviews', // TODO: not in the Django catalogue yet
];

/**
 * Repos pinned to the front of the CV's open-source list.
 * Star counts favour old repos; these are what to lead with now.
 */
export const CV_FEATURED_REPOS: readonly string[] = ['bc-ui-flutter'];

/**
 * Skills the project taxonomy cannot know about.
 *
 * The Technologies section is built from the technologies attached to projects
 * in Django admin, which captures languages and frameworks but nothing about
 * delivery — no CI/CD, no cloud, no methodology. These are declared explicitly,
 * taken from Rifat's own 2022 CV, and merged with the taxonomy-derived list.
 */
export const DECLARED_SKILLS: Record<string, string[]> = {
  'CI/CD & DevOps': [
    'GitHub Actions',
    'Bitbucket Pipelines',
    'Docker',
    'AWS EC2',
    'AWS LightSail',
    'AWS CloudFormation',
    'Nginx',
    'Gunicorn',
  ],
  Data: ['Redis'],
  // These were lost when project *tags* were excluded from the Technologies
  // section — tags mostly hold domain labels, but these three are real
  // infrastructure skills and appear across the deployed projects.
  Infrastructure: ['Ubuntu', 'Supervisor', 'DigitalOcean'],
  Practices: ['Agile', 'SOLID', 'Code review', 'Technical documentation'],
};

/**
 * Marketplace record, from the public CodeCanyon profile.
 * Refresh these by hand — the site does not scrape Envato.
 */
export const CODECANYON = {
  url: 'https://codecanyon.net/user/kmrifat',
  memberSince: '2016-12',
  totalSales: 273,
  rating: 4.71,
  ratingCount: 14,
} as const;
