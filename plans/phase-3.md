# Phase 3: ship v0.1 (book site, public-repo prep, method page, pilot report)

Phase 2 closed with all ten plates approved (tag `phase-2`). Phase 3 turns the pilot into
something public: a static book site for the ten, a repo ready to be flipped public with
a v0.1 release, a method page, the scope note, and the final pilot report. No new
creatures, no new plates, no money.

Spec of record: `docs/Slavic Pilot Brief.md`. Decisions: `docs/BACKLOG.md`. Ben's
answers for this phase (2026-10-27, in conversation): Astro; spreads with no animation;
the agent prepares the public flip but does not perform it; the agent drafts the method
page into the site.

This is an overnight run. Go as far as the milestones allow. Where a judgement is Ben's
(anything visual, anything irreversible), do the work up to the judgement, record the
options, and move on to the next milestone that does not depend on it.

## Milestones and dependency graph

```
3a data export (site/ scaffold + JSON API files) ──┐
                                                   ├─> 3c spreads + index + about pages ──> 3d screenshots for Ben
3b content pages (scope note, method, data) ───────┘
3e public-repo prep (README, LICENSE x2, secret audit, release notes, tag) ── independent of 3a-3d
3f final pilot report + backlog update ── after 3c and 3e
tag phase-3 after 3f
```

3a, 3b and 3e touch disjoint files and can run as parallel lanes. 3c needs 3a and 3b.
3d is the last thing before the report. Nothing in this phase waits on Ben.

## Settled decisions (do not relitigate; planner's choices are vetoable by Ben)

- **Stack (Ben):** Astro, static output, in `site/` with its own `package.json`. Latest
  stable Astro release, exact-pinned; no pre-releases. Root `package.json` gains
  `site:dev`, `site:build`, `site:preview` that delegate into `site/`. The site reads
  `../data/entries/*.json` and `../plates/slavic/*` at build time; it holds no copy of
  the data in its own tree.
- **Presentation (Ben):** book spreads, no page-flip animation. Each creature is one
  spread: plate on the left page, entry on the right, previous/next, and a contents
  page. On narrow screens the spread stacks, plate first.
- **Public flip (Ben):** the agent prepares everything and stops. It does not change
  repo visibility, does not create a GitHub release, does not deploy. Ben flips the repo,
  publishes the release from the drafted notes, and connects Vercel himself.
- **Method page (Ben):** the agent drafts `/method` from `style/STYLE-SHEET.md`,
  `docs/BACKLOG.md` and the phase reports. Ben edits before launch.
- **Code licence (planner, vetoable):** MIT for code (`LICENSE`). The dataset
  (`data/`, `plates/slavic/`, `schema/`) is CC BY 4.0 (`LICENSE-DATA`). The corpus under
  `sources/pages/` is public-domain text and says so in its own README line. Style
  references are PD-Art with their own manifest. This closes the backlog's open item
  "code license for the repo".
- **Interpretive plates (planner, vetoable):** every pilot plate was generated from
  Ben's visual-tradition text, not from the sourced clauses, and carries
  `image.interpretive: true`. The site says so on every spread, in one fixed line under
  the plate: *"A drawing after the folk tradition. The sources describe:"* followed by
  the sourced appearance clauses with their citations. The reader sees both and is never
  told the drawing is a reconstruction. The scope note repeats this.
- **Attestation on the page (planner):** the grade is shown as a labelled badge with a
  one-line plain-English definition on hover or tap, and the verifier's rationale
  beneath it. The four definitions come from the brief's schema section.
- **Citations on the page (planner):** every clause shows its cite tags as small chips
  (`Máchal 1918, p. 240`). A chip links to the source's archive.org item from
  `sources/manifest.json`. Page-level deep links are a stretch goal (see 3c).
- **Public name:** "Beasts". Site title "Beasts: a field guide to Slavic folklore
  creatures". Ben may rename; keep the name in one config constant.
- **Design (planner, Ben judges):** one design pass, not iterated. Off-white paper
  ground, a serif text face, restrained rules, monochrome throughout to match the
  plates. Self-hosted OFL fonts via `@fontsource`, no CDN fonts, no Tailwind, no
  component library. The agent does not judge screenshots by looking; it ships one
  clean design and leaves screenshots for Ben (3d).
- **Data stays authoritative in `data/entries/`.** The site never edits entries. Any
  derived field (display names, sorted clause lists) is computed at build time.
- **No spend, no generation.** `npm run plates` is not invoked in this phase.

## 3a: site scaffold and the JSON API files

- Create `site/` with Astro. `site/src/lib/entries.ts` loads and validates every entry
  against `schema/entry.schema.json` at build (reuse `src/validate/validate.ts` via a
  relative import or a thin copy; do not duplicate the schema).
- Build emits, beside the pages:
  - `/data/slavic/index.json`: id, primary name, family, peoples, attestation grade,
    thumb path, for every entry;
  - `/data/slavic/<id>.json`: the entry verbatim;
  - `/data/schema/entry.schema.json`: the schema verbatim;
  - `/data/LICENSE`: CC BY 4.0 text.

  These are the dataset's API: static files anyone can `fetch`. Document them on the
  `/data` page (3b).
- Plates: copy `plates/slavic/*.web.webp` and `*.thumb.webp` into the build under
  `/plates/slavic/`. Never the `.full.png` masters (they are gitignored and local).
- Tests (`site/test/`): every entry has a spread route; every `image.file` and
  `image.thumb` referenced exists; `index.json` lists exactly the entries on disk; the
  build passes. Add `site:test` to the root scripts and include it in `npm run check`.

## 3b: content pages

- `/about` (the scope note). Written from the brief's "Scope rule" section and the
  backlog. Must state: the inclusion rule ("is anyone alive today supposed to be praying
  to it"); the Slavic exclusions (pre-Christian gods, Rodnovery reconstructions); the
  class-vs-individual rule; that plates are interpretive drawings, not reconstructions;
  that peoples mappings from 19th-century labels are per-entry and flagged, with the
  mapping table still to come; the licence; and how to report an error (GitHub issues).
- `/method`. The pipeline as built: draft, verify, canaries, attestation grades, the
  silverpoint decision and its rejected alternatives, the bake-off verdicts, the
  "what the model does with words" lessons, the spend ($5.21 of $25). Draft it from the
  style sheet and backlog in plain prose. It is Ben's voice to edit, so no marketing
  tone and no claims beyond what the reports support. Include the contact sheet of the
  ten thumbnails.
- `/data`. How to get the dataset: the static JSON paths above, the GitHub repo, the
  schema, the licence, a citation line, and the attestation-grade definitions.

## 3c: spreads, contents, navigation

- `/` is the contents page: title, one sentence, the ten thumbnails in a grid in the
  style sheet's order, each linking to its spread. Nothing else on it.
- `/creatures/<id>/` is a spread. Left page: the web plate with alt text
  "Silverpoint study of <primary name>", the interpretive line, and the sourced
  appearance clauses with cite chips. Right page, in this order: primary name, native
  forms and variants with their peoples; peoples and regions; family; attestation badge
  and rationale; behaviour and habitat; dealing with it; origin; variants (collapsed by
  default, each with its people and its own clauses); related (links to other spreads
  when the id exists); sources; editorial notes. Every clause carries its chips.
- Previous/next at the foot of every spread, in contents order, wrapping.
- Open Graph image per spread = its web plate. Site-wide OG image = the contact sheet.
- Stretch (only if everything above is done and tested): deep-link a cite chip to the
  archive.org page viewer for that leaf, using `sources/manifest.json` plus the page
  label logic in `src/corpus/resolve.ts`. If the mapping is not exact for a source,
  fall back to the item link for that source and say so in the report.

## 3d: screenshots for Ben

- Build the site, run `astro preview`, and take screenshots with the pre-installed
  Playwright: contents page, one figure spread (baba-yaga), the one scene-adjacent spread
  (bannik), one dense spread (leshy), `/about`, `/method`, `/data`, each at 1280 wide and
  at 390 wide. Write them to `docs/phase3-screens/`. The agent does not evaluate them.
- Write `docs/phase3-review.md`: the screenshot list, the three or four design choices
  Ben is most likely to want changed (type size, page proportions, chip density,
  whether variants should be open by default), each with the one-line change to make.

## 3e: public-repo preparation

- `LICENSE` (MIT, copyright brac) and `LICENSE-DATA` (CC BY 4.0). Note in README which
  paths each covers.
- Rewrite `README.md` for a public reader: what it is, the contact sheet, the scope
  rule in two sentences, how to use the data (the JSON paths, the schema, the licence,
  the citation line), how the pipeline works in one paragraph with a link to `/method`,
  the scripts table (kept), how to run the site, and how to report an error. Keep it
  under two screens.
- Secret and privacy audit before anything is public: grep the whole history
  (`git log -p`) for `FAL_KEY`, `fal_`, `sk-`, `Bearer`, email addresses other than the
  git author, absolute home paths, and anything matching a key shape. Confirm `.env`
  was never committed. Confirm `plates/refs/` (copyrighted reference images) and
  `plates/**/*.full.png` never entered history. Confirm `style/refs/` holds only the
  three chosen PD-Art files and the manifest. Record the result in the report. If a
  secret is found in history, stop that lane and report it; do not rewrite history
  without Ben.
- `docs/release-v0.1.md`: release notes Ben pastes into the GitHub release. What is in
  it (ten entries, ten plates, the corpus, the pipeline), the licences, what is not in
  it (full-resolution masters, R2, further creatures), and a thanks-to-sources line.
- `CHANGELOG.md` with a v0.1.0 entry.
- Bump `site/` and root `package.json` to `0.1.0`. Tag `v0.1.0` locally and push the tag.
  Do not create the GitHub release.
- Add a `.github/ISSUE_TEMPLATE/entry-correction.md` so error reports arrive with the
  entry id, the clause, the cite, and the correction.

## 3f: final pilot report and backlog

- `docs/pilot-report.md`: the brief's six evaluation questions answered finally, drawing
  on the Phase 1, 1d and 2 reports. Deliverables checklist from the brief, each marked
  done or not with the path. One paragraph on what the pilot would change before the
  full Slavic batch (the coverage pass, the people-mapping table, draft cost measurement,
  the grade rule). Keep it to one screen plus the checklist.
- `docs/BACKLOG.md`: update the phase map (Phase 3 as defined here; the old "human
  review" row is absorbed into Phase 2, which Ben judged), record the licence decision
  with the rejected alternatives (Apache-2.0 for code; CC BY-SA for data), and add the
  next-phase candidates: Slavic batch scaling, coverage pass, people-mapping table, R2
  and release zips, Hugging Face mirror, agent-readable layer.
- Tag `phase-3`.

## Pinned dependencies

- Astro: latest stable, exact-pinned in `site/package.json`. `@astrojs/sitemap` if used,
  same rule. `@fontsource/<face>` for one serif and, if needed, one sans.
- Playwright is pre-installed in the environment for 3d; do not add it to
  `package.json` or run `playwright install`.
- No other new packages without a line in the report saying why.

## Stop conditions

- Any step that would spend money, change repo visibility, publish a release, deploy,
  rewrite git history, modify `data/entries/`, regenerate a plate, or send a reference
  image anywhere. Stop that lane, record it, continue the others.
- A secret found in history (see 3e).
- The site build failing in a way that needs a dependency outside the pinned set.

## Out of scope

- New creatures, new plates, R2, Hugging Face, the coverage pass, the people-mapping
  table, a style LoRA, translations, dark mode, search, analytics.
- Judging the design. One pass, screenshots, Ben decides.

## Report format

`docs/phase3-report.md`: what shipped per milestone with paths; the secret-audit
result; the screenshot list; the stretch-goal outcome; anything stopped and why; the
commands Ben runs in the morning to review (`npm run site:preview`), to flip the repo
public, and to publish the release from `docs/release-v0.1.md`.
