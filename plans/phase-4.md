# Phase 4: the first Slavic tranche (30 creatures), the review desk, and the style LoRA

v0.1 shipped ten creatures. Phase 4 adds the next 30 Slavic creatures, builds the tool
Ben reviews plates with, applies his design review of the site, and ends by training a
style LoRA on the approved plates. It stops at 30, not 150, because 30 is where the
per-creature cost, the review load and the honesty gaps become measurable, and where the
LoRA becomes trainable.

Spec of record: `docs/Slavic Pilot Brief.md`. Decisions: `docs/BACKLOG.md`. Prompts:
`draft-v2` and `verify-v2`. Style: `style/STYLE-SHEET.md`. Ben's rulings for this phase
(2026-10-28, in conversation) are in "Settled decisions" below.

This is an overnight-capable plan with three independent lanes. Lane A spends money
(drafting under a cap); Lane B and Lane C spend none. The plate work at the end needs
Ben at the review desk, in sessions of ten.

## Milestones and dependency graph

```
Lane A (text)   4a people table + Máchal relabel ──> 4b draft+verify 30 under v2, in three batches of 10
Lane B (desk)   4c review desk: dictation, note-to-edit, writes picks/overrides, LAN-reachable
Lane C (site)   4d design review applied + open questions answered ── independent

4b + 4c ──> 4e plates for the 30, in batches of 10, through the desk ──> [Ben approves each batch]
4e (>= 30 approved, 40 with the pilot) ──> 4f style LoRA: train, bake-off vs base, Ben picks
4f ──> 4g tranche report, backlog, tag phase-4 (data released as v0.2)
```

Lanes A, B and C touch disjoint paths and run in parallel. 4e cannot start until the
desk works end to end on the ten pilot creatures (4c's acceptance test). 4f is gated on
approvals, not on time.

## Settled decisions (do not relitigate; planner's choices are vetoable by Ben)

- **Plates come from Ben's visual-tradition text (Ben, 2026-10-28).** The agent-drafted
  descriptions in the pilot produced plates that did not match the creature as commonly
  pictured, so the pipeline does not generate the visual text. For every creature in this
  tranche, Ben writes (by dictation) the `visual.text`, and it is recorded as a human
  edit with `interpretive: true`, exactly as in the pilot. The agent may prepare a
  *starting draft* of the visual text from the sourced clauses only as a convenience in
  the desk, clearly labelled as a draft, which Ben replaces or edits before any image is
  generated. No plate is generated from an unedited agent draft.
- **Dictation, not typing (Ben).** The review desk takes spoken notes. First
  implementation: the browser's Web Speech API (press-to-talk, Chrome). Second, if names
  are mangled: audio posted to a fal Whisper endpoint. Both write plain text into the
  same field, so the rest of the desk does not care which one is active.
- **Spoken note becomes an edit, with approval (planner).** A note like "nose longer,
  drop the staff, more hunched" is turned by a small model into a revised `visual.text`
  shown as a diff; Ben approves or rewrites, then the redraw is queued. The model edits
  Ben's words; it never adds anything from the sources or from its own knowledge of the
  creature. The raw note and the approved text are both stored.
- **Batches of ten.** Draft, verify, generate and review all move in tens. A review
  session is one batch: look at ten, mark them, done. The three batches are chosen by
  the planner from the candidate list (4a) to mix families: no batch is all household
  spirits.
- **Draft cost cap: $0.50 per creature (Ben, Phase 1 ruling)**, now enforced. Lane A's
  first task is the cost measure: tokens per draft and verify run, converted at the API
  price of the model used, written to `data/cost.json` per creature. A creature that
  would exceed the cap stops before the spend with a written reason for Ben.
- **Plate cap: $1 per plate including redraws (Phase 2 ruling).** Enforced by the
  existing ledger in `plates/spend.json`. The desk shows running spend per creature.
- **People mapping settles now (Ben, 2026-10-28).** One table, applied by draft-v2 and
  checked by verify-v2 from this tranche on. The ten pilot entries are *not* re-run; their
  existing flags stand and the table notes where they would change. Contested rows are
  marked contested and the site's about page says so.
- **Máchal relabel (planner):** switch `machal1918` to `page_label_source: "header"`
  before the batch cites pp. 87-107, and verify the leaf-to-label mapping so the site's
  deep links keep working. If the mapping cannot be verified for a range, those chips
  fall back to the item link, as the site already does.
- **LoRA (Ben, gated).** Train a style LoRA on the approved plates once at least 30 are
  approved (the pilot's ten plus twenty from this tranche is the minimum; all 40 is the
  target). The LoRA is for look consistency, not interpretation: the expected gain is
  fewer redraws per creature, not less authorship. Judged by a blind bake-off, Ben picks.
- **The coverage pass is deferred to the second tranche**, where it has 40 entries to
  sample instead of 10. R2, Hugging Face and the agent-readable layer wait for v1.0.
- **No visibility, release or deploy actions** beyond pushing to `main`, which Vercel
  deploys. The tranche is released as data `v0.2.0` by Ben from drafted notes.

## 4a: people-mapping table and the Máchal relabel (Lane A, first)

- `sources/peoples.json`: one row per source term. Fields: `term` (as printed, with the
  source ids where it appears), `people` (the value `peoples_regions.people` takes),
  `region` (optional), `reasoning` (one or two sentences, citing the usage), `contested`
  (boolean) and `note` (what a reader might object to). Seed it with the six from the
  Phase 1 report (Little-Russia and Little-Russians → Ukrainians; Lusatia → Sorbs;
  Ruthenians; Kief and Chernigof; South-Russian; Kharkov) and every other term the ten
  pilot entries flagged (grep the verify logs). Add rows as the batch meets new terms.
- `prompts/draft.md` and `prompts/verify.md` gain one paragraph each: the draft applies
  the table and flags any term not in it; verify checks the mapping against the table
  and refuses an unlisted term. Version bump to `draft-v2.1` / `verify-v2.1`; record in
  the backlog that this is a scoped change (it adds a lookup, it does not change what
  counts as a claim), so the tranche remains comparable with the pilot.
- The validator rejects a `people` value not in the table's `people` set.
- A short section in `site/src/content/about.md` lists the contested rows.
- Máchal: set `page_label_source: "header"` in `sources/manifest.json`, rebuild its
  pages file, run the audit, and verify the deep-link mapping for the plate-leaf range
  (printed 87-107). Record the result in the report.

## 4b: draft and verify 30 creatures (Lane A)

- Candidate list: `prompts/creatures.json` already holds search hints; extend it to the
  30 chosen, each with its family, the peoples expected, and the sources to start in.
  Planner picks the 30 from the brief's Slavic families (household, water, forest and
  field, undead and death, disease and fate, monsters, oddballs) so that each batch of
  ten spans at least four families and no creature is a mere name variant of a pilot
  entry. The planner's list is in the plan appendix below and is vetoable before 4b
  starts; the agent proceeds with it if there is no veto by the time 4a is done.
- Run the pipeline exactly as in Phase 1d: draft-v2.1, independent verify-v2.1, verify
  log, grade. One planted canary per batch of ten, blind (do not name it in any commit
  message, file name or status; see the Phase 1 contamination finding).
- Draft budget split: a dense creature's draft is split per source when the estimate
  would pass $0.50; the split is logged. The cost measure from the settled decisions is
  implemented first and every run writes to `data/cost.json`.
- Thin entries (one source, no appearance) are kept and graded, as drekavac was. They
  get scene plates in 4e.
- After each batch: `npm run stats`, reconciled; the batch's verify diffs summarised in
  `docs/phase4-batch-<n>.md` in the Phase 1 report's format, briefer.

## 4c: the review desk (Lane B)

A dev-only route in the Astro site, `/_desk/`, excluded from the production build
(guard on `import.meta.env.DEV` and a build-time check that it is absent from `dist/`).
It runs under `npm run site:dev` bound to `0.0.0.0` so Ben's phone on the LAN can open
it, and it has no auth, so it is never deployed.

- **Per-creature view:** the candidate images for the current iteration (all seeds,
  side by side, full size on tap), the sourced appearance clauses with cites, the current
  `visual.text` and `negative_extra`, the reference strip from the gitignored
  `plates/refs/<id>/` (local only, never sent anywhere), the running spend for this
  creature, and the history of notes and edits.
- **Dictation:** a press-to-talk button using the Web Speech API, writing into the note
  field; a plain textarea fallback. A settings toggle for the Whisper path (fal
  endpoint; audio is uploaded, transcript returned, audio discarded). Default off until
  Ben turns it on.
- **Note to edit:** on "apply note", the note and the current `visual.text` go to a
  small model with a fixed instruction: rewrite the visual text to incorporate the note,
  change nothing the note does not ask for, add nothing from outside the note and the
  current text. The result is shown as a word-level diff; Ben accepts, edits inline, or
  rejects. Accepting writes a dated `human_edit` (type `visual-tradition`, with `note`
  = the raw transcript) to `plates/overrides.json`.
- **Actions per creature:** approve seed (writes `plates/picks.json`), redraw (queues a
  generate job with the current text; the desk runs `npm run plates` for the queue and
  shows progress), skip, and a free-text flag for the report.
- **Batch view:** the ten creatures of the current batch as a contact sheet with their
  state (unreviewed, redraw queued, approved), so Ben sees the set together before
  judging any one, as the brief asks.
- **Starting draft (labelled):** when a creature has no `visual.text` yet, the desk
  offers a draft assembled from the sourced clauses, marked "agent draft, not yet yours".
  The generate action is disabled until Ben has edited or replaced it.
- **Storage:** the desk writes only `plates/overrides.json`, `plates/picks.json` and the
  queue file; everything else is read-only. Writes go through a tiny local API in the
  dev server (Astro dev middleware), not from the browser to disk.
- **Acceptance test:** run the ten pilot creatures through the desk read-only (view,
  dictate a note, see the diff, reject) without changing their approved state. Then
  one real round trip on a scratch creature id. Only then does 4e start.

## 4d: design review applied (Lane C)

- Apply the four one-line changes in `docs/phase3-review.md` as Ben rules them; where
  he has not ruled, the planner's defaults: body 18px stays; spread columns
  `5fr / 4fr` to favour the plate; chips stay one per cite; variants stay closed.
- Answer the open questions in `docs/phase3-report.md` with Ben's rulings where given
  and the planner's defaults otherwise, recorded in the backlog: thumbnails get an alt
  of "Silverpoint study of <name>"; empty sections are hidden; "The name" stays;
  the CC BY gloss stays; the method page switches to first person; the site typecheck
  becomes a gate (`npm run check` runs it).
- The about page gains the contested-peoples section from 4a when that lands.

## 4e: plates for the 30 (needs 4b, 4c; Ben at the desk)

- For each batch of ten: Ben dictates or edits the visual text per creature in the
  desk; the agent generates two seeds per creature with the locked style tokens
  (`a-2026-10-27`) and the pilot's negative prompt; Ben reviews in the desk; redraws
  until approval or the $1 cap; `npm run plates:finalise` writes the sizes and the
  `image` field.
- Scene plates for unseen creatures follow the amended unseen rule from Phase 2.
- Every approved plate: web and thumb WebP in git, full PNG local only, as before.
- After each batch: the contact sheet in `docs/` is rebuilt to include it.

## 4f: style LoRA (needs 30 approved in this tranche, or 40 total)

- Training set: all approved web-size plates, each captioned with its approved
  `visual.text` plus the style tokens. Train on fal's LoRA trainer for the locked base
  model (Qwen-Image); exact-pin the trainer endpoint and record its licence. Spend cap
  for training and the bake-off: $20, approved here.
- Bake-off: five creatures from the tranche, redrawn with the LoRA and without, same
  seeds, blind contact sheet, Ben picks. The measure that matters is redraws-to-approval
  on the next batch, so the report records both the pick and the redraw counts.
- If the LoRA wins, bump `style_tokens_version` to `b-<date>` and record the LoRA id
  and weights hash in the style sheet; the base plates are not regenerated.

## 4g: report and backlog

- `docs/phase4-report.md`: per-batch draft and verify stats, cost per creature against
  the cap, grade distribution for all 40, plates per creature and redraws per plate
  before and after the LoRA, desk issues Ben hit, and the answers to: did the cap hold,
  did the desk cut review time, did the grade rule hold up at 40.
- `docs/release-v0.2.md` drafted; `CHANGELOG.md` updated; Ben tags and releases.
- Backlog: second tranche with the coverage pass; R2; the remaining candidates.
- Tag `phase-4`.

## Pinned dependencies

- No new root packages for Lane A.
- Lane B: only what the Astro dev middleware and the diff view need; prefer zero
  packages (the diff can be a 60-line function). Web Speech API needs nothing. If the
  Whisper path is built, it uses the existing `@fal-ai/client@1.10.1`.
- Lane B's note-to-edit model: the same provider and key the pipeline already uses;
  log the model id and cost per call in the desk.
- Lane C: nothing new.

## Stop conditions

- A draft that would exceed $0.50 or a plate that would exceed $1: stop that creature,
  record why, continue the batch.
- Any plate generated from text Ben has not edited or replaced.
- The desk reachable in a production build, or writing any file outside the three it
  owns.
- A reference image from `plates/refs/` leaving the machine in any form.
- A people term the table does not cover and that verify cannot resolve: flag, do not
  guess.
- Anything that changes repo visibility, publishes a release, or spends beyond the caps
  named here ($0.50 per draft, $1 per plate, $20 for the LoRA work).

## Out of scope

- The coverage pass, R2, release zips, Hugging Face, the agent-readable layer, any
  non-Slavic creature, re-running the ten pilot entries, dark mode, search, auth on the
  desk.

## Report format

As Phase 3: `docs/phase4-report.md`, with per-batch sub-reports, the cost table, the
desk acceptance-test result, the LoRA bake-off result, anything stopped and why, and
the morning commands (start the desk, open it from the phone, run a batch).

## Appendix: planner's candidate list for the three batches (vetoable)

Chosen to span families within each batch and to have at least one corpus source each.
The agent confirms source coverage with `npm run find` before drafting and swaps a
creature with no hits for the next one on the reserve list.

- **Batch 1:** kikimora (household), dvorovoi (household), bolotnik (water), vila (water
  and air), polevik (field), upyr as the Russian counterpart to vampir only if the
  sources treat it as distinct, else skip (undead), likho (fate), koschei (monster),
  alkonost (oddball bird), ovinnik (household).
- **Batch 2:** navki or mavka (undead), vodyanitsa if distinct from rusalka (water),
  zlydni (household misfortune), poludnitsa's night counterpart polunochnitsa (field),
  psoglav (monster), bukavac (water monster), karakondžula (undead), the fever sisters
  tryasavitsy (disease), gamayun (oddball bird), lesovik variants only if the sources
  separate them from leshy, else bagnik (swamp).
- **Batch 3:** domovikha (household), bannik's female counterpart obderikha (household),
  mora (night spirit), stuhać (mountain), the plague maiden (disease), zmey's Serbian
  counterpart zmaj if distinct (monster), ala (storm demon), vukodlak if distinct from
  vampir (undead), firebird (oddball), indrik (monster).
- **Reserve:** chugaister, veles's bear forms are out (god), nocnitsa, blud, shishiga,
  vodyanoi's female counterpart, sirin, lel (if not a god).

Where a candidate is a name variant of an existing entry rather than a distinct being,
it becomes a variant inside that entry and the slot goes to the reserve list.
