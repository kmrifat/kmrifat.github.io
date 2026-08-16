# What still needs you

The journey is now built from your real CV, your public CodeCanyon profile and the
GitHub API — not inferred from project IDs. Four things are still open.

---

## 1. One unverified field (blocking the "Unverified" badge)

One entry still carries `draft: true`:

**`src/content/journey/2020-mediusware-cto.md` — end date.**
Your CV is dated April 2022 and still lists CTO as current; Debutify starts
October 2022. I set `end: '2022-09'` as the assumption. Correct it, then delete
the `draft: true` line and the blockquote at the bottom.

~~**`src/content/journey/2024-binary-castle.md` — your title.**~~ Resolved: it's
**Founder**, and you confirmed Binary Castle is your own company running since
2017, not a 2024 studio. The file is now `2017-binary-castle.md`, starts
`2017-07`, and no longer draft.

Removing `draft: true` does three things: drops the badge, drops the `c.` date
prefix, and lets the entry into the `ProfilePage` structured data as
`hasOccupation`. Draft entries are deliberately excluded from that, because an
unverified employment claim is worse machine-readable than absent.

## 2. One thing I could not reach

**Education.** You said you'd paste the details. Nothing in the CV, GitHub or
CodeCanyon records it, and LinkedIn blocks automated access (HTTP 999). Give me
degree, institution and years and I'll add it as the opening entry and as
`alumniOf` in the structured data. StoreKeeper dates to 2015 and you called it
student work, so it belongs just before that.

~~**AR Proactive.**~~ Added as `src/content/journey/2022-arproactive.md` from
your Turing profile: Senior Software Engineer, December 2022 — March 2025, which
covers the old gap between Debutify and Binary Castle (and overlaps both ends).

## 3. Your current role

`src/lib/site.ts` → `SITE.role` currently reads **"Technical Lead & Full-stack
Engineer"**. That's my inference, not your words — the 2022 CV says "Senior
Software Engineer", but you've since been CTO and a Tech Lead. It appears in the
page title, every OG card, and the `jobTitle` in structured data, so it's worth
getting right.

## 4. The images (unchanged, server-side)

All 57 images still 404 from `kmrifat.binarycastle.net`, so every project card
renders a generated gradient placeholder. Once `/media/` serves again and
Cloudflare is purged, run `npm run sync` — the pipeline downloads and optimises
them and the placeholders disappear on their own.

---

## 5. The CV is now generated, not maintained

`/cv/` is built from `src/content/journey/` — the same entries the timeline uses —
and rendered to `K-M-Rifat-Ul-Alom-CV.pdf` at build time by headless Chrome. So
**correcting a journey entry updates the timeline and the CV together**; they can
no longer disagree.

The old April 2022 PDF has been deleted. It ended at CTO at Mediusware, still said
"Senior Software Engineer", and carried a phone number, age and citizenship. The
generated one runs through Binary Castle and contains none of that — verified.

Two consequences of the entries that are still `draft: true`:

- The CV prints **"c. 2020 — 2022"** for Mediusware. The `c.` is the
  unverified-date marker. It is honest, but it reads oddly on a CV — removing
  `draft: true` removes it. Binary Castle no longer carries it.
- **AR Proactive is absent entirely**, because I still have no title or dates for
  it. The CV currently jumps from Debutify ending in April 2023 to Binary Castle
  starting in March 2024, leaving an unexplained eleven-month gap that a recruiter
  will notice. This is the most valuable thing you could send me.

If the PDF is ever missing (no Chrome on the build machine), the download link
still resolves — `/cv/` is a complete, printable page on its own.

## Deliberately not published

From the CV: your **WhatsApp number**, **age** and **citizenship**. `kmrifat@gmail.com`
is published, since it's already public on your CodeCanyon profile.

## Open-source curation

`scripts/lib/github.mjs` decides what appears on `/open-source/`. Currently:
every non-archived public repo in `binary-castle`, plus personal repos with 10+
stars, plus an explicit `ALWAYS_INCLUDE` list (`sb-form`, `laravel-shopify`,
`django-commerce`). `dap-doc` is excluded at your request, along with this repo,
`leetcode`, and practice repos. Edit those three lists to change what shows.

---

## Commands

```bash
npm run dev        # local dev server
npm run build      # OG cards + static build
npm run verify     # publication gate — run after build
npm run sync       # pull fresh content from Django + GitHub
npx vitest run     # unit tests + live API parity checks
```
