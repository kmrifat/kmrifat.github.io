// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { SITE_URL } from './src/lib/site-url.mjs';

// GitHub Pages serves `/projects/index.html` at `/projects/`, so `trailingSlash: 'always'`
// keeps our canonical URLs identical to what Pages actually hands out.
export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: { format: 'directory' },

  integrations: [
    react(),
    sitemap({
      // `/og/` emits PNG endpoints, `/project/` holds the legacy redirect stubs,
      // and `/cv/` is noindex — listing a noindex page in the sitemap is a
      // contradiction crawlers report as an error.
      filter: (page) =>
        !page.includes('/og/') && !page.endsWith('/cv/') && !/\/project\/[^/]+\/$/.test(page),
    }),
  ],

  vite: {
    // `@astrojs/tailwind` peers cap at astro ^5 / tailwindcss ^3, so the Vite plugin
    // is the only supported path for Tailwind 4 here. Config is CSS-first via @theme.
    plugins: [tailwindcss()],
  },

  image: {
    // Build-time optimisation of images pulled from the Django media host. The sync
    // script downloads them into src/assets/remote/, so this is only a safety net for
    // anything referenced remotely at render time.
    remotePatterns: [{ protocol: 'https', hostname: 'kmrifat.binarycastle.net' }],
  },
});
