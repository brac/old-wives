# Phase 3 report: ship v0.1

Written 2026-10-27, after milestone 3f. Phase 3 built the book site for the ten, the scope
note and method page, and the public-repo preparation, and closed the pilot in writing.
Nothing was stopped. Nothing was flipped, released, deployed or spent: those steps are
yours, and the commands are at the end. Read `docs/pilot-report.md` next.

## What shipped

Commits from `git log --oneline 04954d5^..HEAD`, oldest first. The 3f docs are not yet
committed.

| Milestone | Commit(s) | Tag | Main paths |
| --- | --- | --- | --- |
| plan | `04954d5`, `c721781` (ignore lane worktrees, Astro state) | | `plans/phase-3.md`, `.gitignore` |
| 3a site scaffold and JSON API | `3ec4c5b`, merge `5540157` | `phase-3a` | `site/` (Astro 7.4.2, EB Garamond 5.3.0, exact-pinned), `site/src/lib/entries.ts` (validates every entry at build), `site/src/pages/data/slavic/*.json.ts`, `docs/contact-sheet.webp`, root `site:*` scripts |
| 3b content pages | `6158911`, merge `2dc456a` | `phase-3b` | `site/src/content/about.md` (scope note), `method.md`, `data.md`; claims table `.phase-loop/reports/3b-claims.md` (79 rows) |
| 3e public-repo prep | `e568ed3`, merge `e40e0ee` | `phase-3e` | `LICENSE` (MIT), `LICENSE-DATA` (CC BY 4.0), `sources/README.md`, `README.md`, `CHANGELOG.md`, `docs/release-v0.1.md`, `.github/ISSUE_TEMPLATE/entry-correction.md` |
| 3c-1 contents, spreads, design | `571d88d` | | `site/src/styles/book.css`, `site/src/pages/index.astro`, `site/src/pages/creatures/[id].astro`, `site/src/components/Chips.astro`, `Clauses.astro`, `site/src/lib/cite.ts`, `grades.ts` |
| 3c-2 content pages, scene, deep links | `ef3a5b6` | `phase-3c` | `site/src/pages/{about,method}.astro`, `site/src/pages/data/index.astro`, `site/src/layouts/Prose.astro`, `site/src/lib/deeplink.ts`, link crawler in `site/test/pages.test.ts` |
| 3d screenshots | `bf6e4e5` | `phase-3d` | `docs/phase3-screens/*.png` (14), `docs/phase3-review.md` |
| 3f reports and backlog | uncommitted | `phase-3`, `v0.1.0` to follow | `docs/pilot-report.md`, `docs/phase3-report.md`, `docs/BACKLOG.md` |

The site builds 14 pages. At 3c-2, `npm run check` ran 214 root tests and 54 site tests.

## Secret audit (3e)

| Item | Result |
| --- | --- |
| Scope | all refs and tags at the time, 83 commits, diff lines and messages |
| Key patterns (`FAL_KEY`, `fal_`, `sk-`, `Bearer`, `ghp_`, `AKIA`, private keys and others) | **no secret.** The 4 `FAL_KEY` hits are a variable name and an env-presence check, with no value |
| Long key-shaped strings | all benign: fal request ids, npm integrity hashes, file hashes, archive.org ids |
| `.env`, `plates/refs/`, `*.full.png` | never committed |
| `style/refs/` | only the three chosen references and `manifest.json`, ever |
| Home paths | none outside the author lines |
| Email | the git author email is on all 83 commits and becomes public on the flip (open question 1) |

## Screenshots

14 full-page PNGs at 1280 and 390 px wide: contents, baba-yaga, bannik, leshy, about,
method and data. The list, the four design choices you are most likely to change and the
one-line edit for each are in `docs/phase3-review.md`. Nobody has looked at them yet.

The screenshots are now in git history: 9,519,286 bytes for the 14 files (`du -cb
docs/phase3-screens/*.png`), about 9.5 MB (9.1 MiB). The brief for 3f quoted 9.2 MB.
Removing them later would need a history rewrite, so decide before the flip whether that
matters.

## Stretch goal: page deep links (3c-2)

Done. A cite chip links to the archive.org page where the source's page labels are safe,
and to the item otherwise.

| Link type | Chips | Sources |
| --- | --- | --- |
| Deep link to the page | 959 | Máchal 1918 (255; sample-checked against the viewer), Ralston 1872 (400), Ralston 1873 (47), Afanasyev 1868 (155) and 1869 (96), Erben (6) |
| Item link | 19 | Afanasyev 1865 (header labels, leaf mapping not verified), Karadžić 1818 and 1852 (headword `s.v.` cites) |
| Entry URL | 15 | Frombald 1725 (Wikisource) |

A label that repeats in, or is missing from, a source's pages file falls back to the item
link. The Máchal deep links rely on archive.org's labels; the consequence for the open
`page_label_source` switch is recorded in `docs/BACKLOG.md`.

## Stopped

Nothing. No report records a stop condition. The secret audit found nothing, so 3e ran to
the end.

## Open questions for you

Collected from the 3a to 3e reports and the pilot report, with duplicates merged and
those already resolved by a later milestone left out.

| # | Question | From |
| --- | --- | --- |
| 1 | Keep your email as the visible commit author on the flip? Changing it in history is a rewrite; the GitHub noreply address fixes future commits only. | 3e |
| 2 | What is the public URL? OG and canonical URLs stay root-relative until `site` is set in `site/astro.config.mjs`. The README cite-as line assumes `github.com/brac/beasts`. | 3a, 3d, 3e |
| 3 | The four design choices in `docs/phase3-review.md`: body size, page proportions, chip density, variants open by default. | 3d |
| 4 | Contents thumbnails have empty alt text (the name beneath is the link). Keep, or give each image its own alt? | 3c-1, 3d |
| 5 | Empty sections say "Nothing in the cited sources." Keep, or hide them? | 3c-1, 3d |
| 6 | The name's meaning is headed "The name". Keep, or retitle? | 3c-1, 3d |
| 7 | The about page glosses CC BY as allowing commercial reuse with credit. Keep the gloss? | 3b |
| 8 | The method page names you in the third person ("written by Ben"). Keep, or switch to first person? | 3b |
| 9 | `tsc -p site/tsconfig.json` reports one error in root `src/validate/validate.ts` under bundler resolution; the root typecheck and the build are clean. Add a site typecheck gate? | 3a |
| 10 | Pinned up as a set (`docs/contact-sheet.webp`, the contents screenshot), do the ten plates read as one book, and do Baba Yaga and Zmey Gorynych avoid stock fantasy? | pilot report, question 4 |
| 11 | For the Slavic batch, do plates keep coming from your visual-tradition text? It makes you the reviewer of every creature. | pilot report |

## Morning commands

Review locally (the root `node_modules` must already be installed; run `npm ci` first if not):

```sh
npm ci --prefix site
npm run site:build
npm run site:preview
```

Flip the repo public, after deciding question 1:

```sh
gh repo edit brac/beasts --visibility public --accept-visibility-change-consequences
```

Publish the release (after `phase-3` and `v0.1.0` are tagged and pushed):

```sh
gh release create v0.1.0 --title "Beasts v0.1.0" --notes-file docs/release-v0.1.md
```

**Vercel: do not use root directory `site`.** The site build reads outside `site/`: it
loads `../data/entries/*.json`, `../plates/slavic/*` and `../sources/`, and it imports
`src/validate/validate.ts`, which needs `ajv` and `ajv-formats` from the root
`package.json`. With root directory `site`, Vercel installs only `site/`'s dependencies,
so the build fails on the missing root packages even if the files outside `site/` are
present. Use these project settings instead (not tried on Vercel):

| Setting | Value |
| --- | --- |
| Root directory | `.` (the repo root) |
| Framework preset | Other (or Astro, with the overrides below) |
| Install command | `npm ci && npm ci --prefix site` |
| Build command | `npm run site:build` |
| Output directory | `site/dist` |
