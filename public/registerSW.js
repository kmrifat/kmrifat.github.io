/**
 * No-op stub.
 *
 * Cached copies of the 2022 index.html still contain
 * `<script id="vite-plugin-pwa:register-sw" src="/registerSW.js">`, so this path
 * keeps getting requested by browsers that have the old shell in their HTTP
 * cache. Serving an empty 200 here avoids a console error during the changeover.
 *
 * The new site registers no service worker — see public/sw.js for the kill switch.
 */
