/**
 * Turns a taxonomy display name into a URL-safe token.
 *
 * Display names in the Django admin contain dots and spaces ("Vue.js",
 * "Django Rest Framework"), which are ugly and ambiguous in a query string.
 * We keep both forms: the slug for new URLs, the display name for rendering
 * and for parsing legacy URLs from the 2022 site.
 *
 *   "Vue.js"                 -> "vue-js"
 *   "Django Rest Framework"  -> "django-rest-framework"
 *   "SportData.io"           -> "sportdata-io"
 *   "C++"                    -> "c"
 */
export function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
