/**
 * Pagination constants, shared between the site and the Node build scripts.
 *
 * Plain `.mjs` for the same reason as schemas.mjs: `scripts/verify-build.mjs`
 * needs `DEFAULT_PAGE_SIZE` to know how many cards the statically rendered
 * listing should contain, and Node cannot import a `.ts` file. Node 22.12 —
 * the version CI pins, matching Astro's declared floor — has no type stripping,
 * so importing types.ts worked locally on a newer Node and failed in CI.
 */

/**
 * Deliberately larger than the catalogue (16 projects today).
 *
 * The listing island is server-rendered, so whatever the first page shows is
 * what ends up in the static HTML that crawlers and no-JS visitors get. A
 * default of 12 would silently drop 4 projects out of that HTML — pages 2+ only
 * exist once JavaScript runs. Showing everything on one page keeps the static
 * document complete, and pagination still engages automatically if the
 * catalogue grows past this number or the visitor passes an explicit
 * `?page_size=`.
 */
export const DEFAULT_PAGE_SIZE = 24;

export const MAX_PAGE_SIZE = 100;
