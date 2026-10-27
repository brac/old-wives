# Beasts backlog and decision log

The spec of record is `docs/Slavic Pilot Brief.md`. This file holds the phase map
and the project-scoped "why" behind decisions, each with the rejected alternative.

## Phase map

| Phase | Delivers | Needs Ben |
| --- | --- | --- |
| 0 | Foundation: repo scaffold, entry JSON Schema and validator, PD source corpus with manifest and citation resolver, draft and verify role prompts | No |
| 1 | Stages 1 and 2 for all ten pilot creatures: drafted, independently verified, graded entries plus per-entry verify diffs | No |
| 2 | Style sheet, image generation (stage 3) and vision check (stage 4) | Yes: style and image-model brainstorm first |
| 3 | Human review (stage 5), scope note draft, pilot report answering the six evaluation questions | Yes |

## Decisions

- 2026-10-26: Overnight run covers Phase 0 and Phase 1; nothing visual or billable.
  Rejected: stopping after Phase 0, which would leave the night's second half idle
  when Phase 1 needs no human judgement.
- 2026-10-26: TypeScript on Node (ajv for JSON Schema, vitest). Rejected: Python,
  whose text tooling is stronger but which does not match the likely static-site
  front end.
- 2026-10-26: Draft and verify agents run as Claude Code subagents driven by
  versioned prompt files in the repo, with no API spend. Rejected: scripted Claude API
  calls from day one; revisit when scaling past the pilot to 100+ creatures.
- 2026-10-26: Branch renamed `master` to `main`; private GitHub repo `brac/beasts`;
  repo-local git author `brac`. Rejected: local-only repo.
- 2026-10-26: Image model and provider, style tokens, plate format and the three open
  style decisions (lettering, spot color, background) are deferred to a brainstorm
  with Ben before Phase 2. Rejected: picking a provider overnight, because it is a
  billing lever and Ben is the visual judge.
- 2026-10-26: Phase 0 settled decisions (corpus layer, tag grammar, source ids, the two
  added sources Calmet 1850 and Erben 1893, two-stage validation, verify log) are
  recorded with their rejected alternatives in `plans/phase-0.md`.

## Open items

- Drekavac has one PD author (Karadžić 1818/1852, a one-line gloss). Candidate second
  sources: Milićević, *Život Srba seljaka* (1894) and *Glasnik Zemaljskog muzeja*
  (1889 on). The IA Google scans have no usable Cyrillic text layer; a better scan is
  needed (digitalna.nb.rs, BSB). The pilot proceeds with the thin source and lets the
  verify stage grade it.
- Machal 1918's English translator: confirm the name and death year before quoting at
  length for an EU audience. US public-domain status is clear.
- Code license for the repo (the dataset is CC BY 4.0 per the brief): decide by Phase 3.
- 2026-10-26: Phase 0 closed (tag `phase-0`). The validator now rejects unresolvable
  citations, page tags on the column-numbered dictionaries, and source rows that
  disagree with the manifest. The draft and verify role prompts are frozen at
  `draft-v1` / `verify-v1` for the whole pilot batch, for the same reason the brief locks
  the style tokens: changing them mid-batch invalidates the set comparison.
- Open for Ben: does Karadžić's dictionary (one collector, two editions) count as
  "multiple sources" for the `regional` grade? The verify prompt counts sources by
  author, so drekavac will likely land on `literary` rather than the `regional` the
  brief expects.
- Machal 1918 page labels: IA counts blank plate leaves as pages, so printed pp. 87-107
  carry labels 91-115 and labels 108-115 repeat. Switch `machal1918` to
  `page_label_source: "header"` (built in the Phase 1 corpus fix) and check the plate
  leaves before any batch cites that range. No pilot citation is affected.
- 2026-10-27: Phase 1 closed (tag `phase-1`). All ten pilot creatures are drafted and
  independently verified; results and the six open decisions for Ben are in
  `docs/pilot-phase1-report.md`. The headline decision is the grade rule: whether a
  single folklore collector (Afanasyev, Karadžić) counts as the brief's "one
  19th-century compiler". Verifiers ruled both ways on the same pattern.

## Ben's rulings on the Phase 1 report (2026-10-27)

Ruled in conversation on 2026-10-27, answering the six open decisions at the end of
`docs/pilot-phase1-report.md`. None of these has been applied to the data yet; applying
them is the next fix round (see "Follow-up work" below).

1. **Grade rule: a single folklore collector counts as the brief's "one 19th-century
   compiler", for now.** Bannik and drekavac stay literary, and zmey-gorynych drops from
   regional to literary. Rejected: treating a collector who prints the folk texts
   themselves as distinct from a compiler, which would have moved bannik and drekavac to
   regional. Ben marked this "fine for now", so it is a pilot ruling that may be
   revisited at scale, and no fifth grade is added.
2. **Ralston's independence: one rule applied to all ten.** Ben said to go ahead with
   the report's proposal without choosing between its two readings. The planner's
   choice, open to Ben's override: Ralston 1872 counts as dependent on Afanasyev for any
   passage where he cites Afanasyev, and as independent elsewhere. Rejected: counting him
   dependent wholesale, which ignores his own fieldwork and other sources and would put
   the baba-yaga grade at risk on a technicality. The fix round re-checks baba-yaga under
   this rule.
3. **People mapping: deferred (\*).** Ben does not want to settle the mappings for
   Little-Russia, Lusatia, Ruthenians, Kief/Chernigof, South-Russian and Kharkov now. The
   existing per-entry flags stand, and the mapping table is an open item to return to
   before the Slavic batch scales. Rejected: settling a mapping table now, at Ben's
   request.
4. **Question 1 confirmed: 8 of 10 appearance fields are clean.** Vodyanoi and drekavac
   are not clean, and vampir and zmey-gorynych are borderline-clean.
5. **Template changes before scaling:**
   - Yes: the draft must reconcile contradicting appearance clauses (the vodyanoi gap:
     bald against long hair, two different caps).
   - Yes: `family` becomes a checkable item that verify can support, narrow or remove.
   - Not ruled: allowing verify to move clauses between a variant and the top level. This
     stays open; until it is ruled, verify keeps flagging misfiled clauses without moving
     them.
6. **Draft budget: about $0.50 per creature at most.** A dense creature may go over that
   cap only with written reasoning that Ben sees before the spend. Rejected: choosing
   between a per-source split and a flat larger budget now. The split is one way to stay
   under the cap. Caveat: Phase 1 ran as Claude Code subagents with no metered API spend,
   so there is no per-creature cost measurement yet. Enforcing the cap needs a cost
   measure (token counts converted at the API price of the drafting model), which the
   fix round has to define.

## Ben's Phase 2 brainstorm answers (2026-10-27)

The full answers are in `docs/phase2-brainstorm.md`. Settled, with what each rejected:

- **Idiom: Renaissance silverpoint study** (after Leonardo; sharper and higher-contrast
  than the originals), monochrome for the whole first pass. Rejected: lubok (too
  old-world), the Grimm television show's illustrations (too amateur), pen-and-ink
  engraving, and a short colour palette. The brief's "House style" section was amended to
  match.
- **Model: fal.ai, chosen by a bake-off.** FLUX.2 pro, Nano Banana Pro and Recraft V4 are
  given identical text and 3 to 5 style references, on baba-yaga, bannik and
  zmey-gorynych (nine images), and Ben picks by eye. Rejected: PixelLab (wrong idiom), and
  locking a model before seeing output. A style LoRA is deferred until about 30 plates are
  approved.
- **Licensing:** only commercially licensed endpoints are used, and a candidate whose
  terms are ambiguous about CC BY 4.0 is dropped rather than argued.
- **Budget:** $25 cap for the pilot (bake-off, test grid, ten plates and their
  regenerations); $1 per plate, including regenerations, at scale. Spend is recorded per
  plate in `image`.
- **Format:** portrait 3:4, at least 2048 px on the long edge; full figure, centred, on a
  fixed ground line on a plain paper ground. Nothing is generated around the figure: no
  border, cartouche, lettering or scale object. Scale goes in the caption. Rejected: a
  drawn scale figure or ruler.
- **Test grid:** drawing guides on or off × plain or lightly prepared paper, on
  baba-yaga and bannik (eight images); the tokens lock after Ben picks. This replaces the
  brief's lettering × spot colour × background grid.
- **Vision check:** mechanical mismatches only, plus a monochrome check and a no-colour-fill
  check. No taste grading; Ben judges every plate.
- **Content:** re-run all ten under v2 before final plates (D1 (a)). The style work may use
  the v1 text for baba-yaga, bannik and zmey-gorynych in the meantime. Drekavac gets a
  scene plate. Leshy is drawn in his own shape. Poludnitsa uses the `poles` variant. The
  prompt takes at most 10 clauses, chosen by support count; dropped clauses are logged,
  and any override is Ben's, recorded as a human edit.
- **Storage:** web and thumbnail WebP files go in git under `plates/slavic/`, and the
  full-resolution PNG goes to a Cloudflare R2 bucket plus a GitHub Release zip. No Git LFS,
  and full-resolution files are never committed. `image.plate` stores the stem only.
- **Also added to the backlog by Ben:** a coverage pass that samples uncited pages for
  name variants, to find omissions the verify stage cannot see; revisit the grade rule
  once the grade distribution is visible; and a style sheet that carries the references,
  the locked tokens, the bake-off contact sheet and the reason for silverpoint.

## Model licence and follow-up rulings (2026-10-27, later the same day)

- **The bake-off line-up changes to open-weights models: Qwen-Image, Z-Image (base) and
  FLUX.1 [schnell], all on fal.** Research (`.phase-loop/research/output-licence.md`)
  found both FLUX.2 pro and Nano Banana Pro ambiguous under Ben's licence rule. BFL and
  Google only decline to claim ownership of outputs; neither grants a redistribution
  licence; and BFL bans training on outputs, which CC BY cannot carry. So both were
  dropped as the rule requires. Recraft V4 was dropped for having no seed and no reference
  input. The replacements are Apache 2.0 at the weights layer
  (`.phase-loop/research/open-models.md`). Rejected: asking fal and BFL in writing (slow),
  and relaxing the rule to "commercial use plus non-claim". fal's own terms disclaim
  ownership of outputs, whichever model is used. Whether purely AI-made images can carry
  copyright at all is an open legal question, recorded but not resolved.
- **Plate size: the 2048 px minimum is lowered.** The master is the winning model's
  native 3:4 portrait size (roughly 1024 to 1328 px on the long edge), with no upscaling.
  Rejected: generating above native size (quality risk) and an upscaler (a second
  licence to clear).
- **Style references: Ben picks them by eye** from the six public-domain candidates in
  `.phase-loop/research/style-refs.md`, shown on a contact sheet. Rejected: the planner's
  pick of 1, 3, 5 and 6.
- **fal key:** the key from the DungeonsAndDatasets project is reused, copied into a
  gitignored `.env`. Rejected: a new Beasts-only key.
- **Draft budget raised from $0.50 to $1 per creature,** measured as API-equivalent cost:
  the agent's reported token usage priced at list price (Opus 5.5: $4 per million input,
  $20 per million output). Overruns still need written reasoning that Ben sees first.

## Rulings during the v2 re-run (2026-10-27)

- **Style references: candidates 2, 3 and 5** (Leonardo's study of a woman's hands,
  Dürer's self-portrait at thirteen, and Holbein the Elder's head of a crossbowman),
  picked by Ben by eye from the contact sheet and used as they are, with no crop. Only
  these three are committed, under `style/refs/`. Rejected: the planner's suggestion of
  1, 3, 5 and 6.
- **Dense creatures: accept the gaps.** Seven v2 drafts (domovoi, vodyanoi, leshy,
  rusalka, baba-yaga, vampir and zmey-gorynych) stopped at their roughly 100k-token
  budget with relevant pages unread, mostly in Afanasyev. Each draft's scope note lists
  the unread pages, and verify runs on the drafts as they stand. Rejected: a second
  draft agent that reads the unread pages (about $0.50 to $1 per creature). The gap is a
  scaling finding for the 1d report, not something fixed in the pilot.
- **Ralston rule: kept as written.** Ralston is dependent on Afanasyev only where he
  cites or quotes him on that passage. Bannik therefore stays `regional`, although its
  verifier found that Ralston 1872 p.123 closely follows Afanasyev 1868 p.69 without
  citing him. Rejected: widening the rule to cover close, uncited paraphrase. The case
  is recorded as a known limit of the rule.

## Bake-off verdict and Phase 1d decisions (2026-10-27)

- **Model: Qwen-Image (setup D), locked for the pilot.** Ben's blind read: D for baba-yaga
  (good hatching, but the nose reads as a cap and needs a regeneration) and D for bannik
  (good hatching, but no setup made the bannik read). For zmey-gorynych he preferred A
  (Z-Image) or C (FLUX.1 schnell): D's serpent is a blob with text across the top. None of
  the four is great. Rejected:
  - B, Qwen edit with references: it copied the reference drawing and added a face.
  - A, Z-Image: the hatching is good but the structure is nonsensical.
  - C, FLUX.1 schnell: the most complete, but it shows AI artefacts and reads as a
    tattoo.

  Qwen-Image's known faults (the nose, text on the serpent) go to the test grid and the
  regeneration budget, not to another model change.
- **Scene plates may show an invented presence (Ben, after the bannik plates read too
  abstract).** The entry data stays unchanged: no invented appearance enters the entry.
  The plate prompt for an unseen creature adds a minimal, indistinct presence (for
  example a shape or hand in the steam), and the image record and caption mark the plate
  as interpretive. The brief's unseen rule is amended. Rejected:
  - the empty scene (reads abstract);
  - a sourced act shown with the creature unseen (the planner's recommendation).

  The planner's mechanism, which Ben can veto: one fixed, creature-neutral presence token
  is appended only to scene-plate prompts, together with the best-supported behaviour
  clause, so that the presence is doing something sourced.
- **Grade rules: settled as they stand, with no more tokens spent on them.** The
  collector rule and the per-passage Ralston rule stay. Bannik and zmey-gorynych remain
  regional. Rejected: re-deriving dependence passage by passage.
- **Ralston's general "Snake" passages count as Zmey Gorynych lore.** The 8 referent
  flags in zmey-gorynych are resolved "yes" and the clauses stand. Rejected: removing
  them.
- **No forms inside variants**, at least for the first pass. Rejected: another level of
  detail in the schema.
- **Footnotes:** a footnote stays a reference, not lore. Where it points to a story that
  is in the corpus, the draft may follow it and cite the story itself. Rejected: citing
  narrative footnotes directly.
- **Partial-support tags are accepted.** A clause may keep a tag whose page supports
  only part of it, as long as its tags together support the whole. Rejected: requiring
  every tag to carry the whole clause.
- **Cost is measured in tokens, not dollars.** The goal is a rough shape of each
  creature, not exhaustive reading. Keep the existing per-agent budget (about 100k
  tokens), with no top-ups and no second reading passes. Do not burn Ben's daily token
  allowance. This replaces the $1-per-creature cap. Rejected: getting each agent's
  input/output split to price runs exactly.

## Backlog added 2026-10-27

- Drekavac: check the 1818 page image for the two words the OCR garbles (probably
  "der Schreyer" and "vom Wolfe"). If they are confirmed, the entry gains a name
  meaning and the wolf detail.
- Footnotes as lore: draft-v2 treats footnote lines as references, so story content in
  footnotes is skipped. An example is the Siberian Zmey Gorynych tale in a footnote on
  Afanasyev 1868 p.591. Decide whether footnotes that carry narrative may be cited.
- `cite` with s.v. prints a single leaf, so a dictionary entry that continues onto the
  next leaf is cut short. The tag grammar has no way to reach that continuation (for
  example karadzic1818, Вукодлак, leaves 122-123). This was found again in v2.
- Canary blindness: an uncommitted canary shows up in the git status that the harness
  hands to subagents, and a committed one shows up in the recent-commits list. Neither
  route is fully blind. Find a way to plant a canary that a verifier cannot see in
  either place.

## Follow-up work from the rulings

- Fix round (Phase 1d, not yet planned): re-grade zmey-gorynych to literary, apply the
  Ralston rule and re-check baba-yaga, write draft-v2 (reconciling appearance clauses)
  and verify-v2 (checkable `family`), and define the per-creature cost measure. Whether
  the ten entries are re-run under the v2 prompts before Phase 2 is an open question in
  `docs/phase2-brainstorm.md`.
- People mapping table (\*): deferred by Ben on 2026-10-27; return to it before scaling.
- Phase 2: blocked on the brainstorm. The questions for Ben are in
  `docs/phase2-brainstorm.md`; his answers go into that file and come back through the
  repo.
