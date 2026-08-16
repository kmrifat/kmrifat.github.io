# kmrifat.github.io

Portfolio for K M Rifat Ul Alom. Astro 7 + React islands, deployed as a static
site to GitHub Pages.

Content comes from three places, merged at build time:

| Source                                  | What it provides                                | How it updates                           |
| --------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Django API (`kmrifat.binarycastle.net`) | The 16-project catalogue, taxonomy, screenshots | `npm run sync`, committed to `src/data/` |
| GitHub API                              | Open-source repos and star counts               | same sync run                            |
| `src/content/journey/`                  | Career timeline — also the source of the CV     | hand-edited Markdown                     |

## Commands

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run verify
```

```bash
npm run sync
```

`build` runs three things in order: OG card generation, `astro build`, then
renders `/cv/` to PDF with headless Chrome. `verify` is the publication gate —
run it after `build`, never before.

```bash
npx vitest run
```

Unit tests plus a parity suite that checks client-side filtering against the live
Django API. The parity tests skip themselves when the API is unreachable, so a
backend outage never fails an unrelated change.

## How deploys work

**`.github/workflows/ci.yml`** — pull requests and non-`main` branches.
Formatting, types, tests, build, and the publication gate. Never deploys.

**`.github/workflows/deploy.yml`** — the only workflow that publishes.

Triggers:

- **push to `main`** — builds from the committed content snapshot. Deterministic:
  a code change never picks up unrelated content drift.
- **`repository_dispatch: content-updated`** — fired by the Django admin when
  project content changes. Syncs first, then builds.
- **nightly cron** (`17 3 * * *`) — safety net if a webhook is missed.
- **manual dispatch** — with a checkbox to skip the sync.

Sync and build live in one workflow deliberately. A push made with `GITHUB_TOKEN`
does not trigger other workflows, so splitting them would let a sync commit a
snapshot that never got built.

After deploying, a `smoke` job fetches the live site and asserts that every key
route returns 200 with expected content — including `/sw.js`, which must keep
serving the kill switch that unregisters the 2022 service worker. This catches
Pages-side failures that never touch the build.

## One-time setup

1. **Settings → Pages → Source: "GitHub Actions"** (currently `legacy`, i.e.
   deploy-from-branch). `actions/deploy-pages` fails with an opaque error until
   this changes. **Do it after the first push of this branch to `main`**, not
   before — flipping it with no workflow present leaves nothing to build.
2. **Repository variable `API_BASE`** (optional) — defaults to
   `https://kmrifat.binarycastle.net/api`.
3. **Django side**: a fine-grained PAT scoped to this repo with
   `Contents: read and write`, set as `GITHUB_DISPATCH_TOKEN` in the backend
   environment, so admin saves trigger a rebuild.

`GITHUB_TOKEN` is provided automatically and is what authenticates the
open-source sync — without it the GitHub API allows 60 requests an hour per
runner IP and rate-limits in practice.

## Things that are load-bearing

- **`public/sw.js`** must stay at exactly that path. The 2022 site registered a
  Workbox service worker at scope `/` that serves its own cached shell for every
  navigation; this file unregisters it. Remove it and returning visitors keep
  getting the old site forever.
- **`.nojekyll`** must stay in `public/`. Without it GitHub Pages hides every
  underscore-prefixed directory, breaking all of `/_astro/`.
- **`src/data/*.json`** is generated. It is committed so the site can rebuild
  when the Django box is down, and it is in `.prettierignore` so the formatter
  and the sync script do not fight over it.

See [CONTENT.md](CONTENT.md) for what still needs filling in.
