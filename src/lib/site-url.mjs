// Single source of truth for the deployed origin.
// Kept as plain .mjs with no imports so astro.config.mjs, the sync script, and
// Node-side build tooling can all read it without a TS transform step.
export const SITE_URL = 'https://kmrifat.github.io';
