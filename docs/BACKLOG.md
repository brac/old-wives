# Beasts backlog and decision log

The spec of record is `docs/Slavic Pilot Brief.md`. This file holds the phase map
and the project-scoped "why" behind decisions, each with the rejected alternative.

## Phase map

| Phase | Delivers | Needs Ben |
| --- | --- | --- |
| 0 | Foundation: repo scaffold, entry JSON Schema and validator, PD source corpus with manifest and citation resolver, draft and verify role prompts | No |
| 1 | Stages 1 and 2 for all ten pilot creatures: drafted, independently verified, graded entries plus per-entry verify diffs | No |
| 2 | Style sheet, image generation (stage 3) and vision check (stage 4) | Yes: style and image-model brainstorm first |
| 4 | First Slavic tranche: people-mapping table, 30 creatures drafted and verified in batches of ten under the $0.50 cap, a dictation-driven review desk, the site design review applied, a style LoRA once 30 plates are approved. Plan: `plans/phase-4.md` | Yes: review sessions of ten at the desk, LoRA pick |
| 3 | Ship v0.1: Astro book site for the ten, scope note, method page, public-repo prep (licences, README, release notes, tag), final pilot report. Human review (stage 5) was absorbed into Phase 2, where Ben approved all ten plates. Plan: `plans/phase-3.md`. **Delivered 2026-10-27** (tags `phase-3a`, `phase-3b`, `phase-3c`, `phase-3d`, `phase-3e`; `phase-3` and `v0.1.0` follow the final report). Reports: `docs/phase3-report.md`, `docs/pilot-report.md` | Only to flip the repo public and connect Vercel |

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
- ~~Code license for the repo (the dataset is CC BY 4.0 per the brief): decide by Phase 3.~~
  Closed 2026-10-27: MIT for code, CC BY 4.0 for data and plates (`LICENSE`,
  `LICENSE-DATA`); see "Phase 3 decisions".
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

## Ben's rulings on the candidate plates, 2026-10-27

- **Plates are monochrome only.** Colour words in an entry are drawn as tone. Rejected: colour plates, and a single muted tint.
- **Taste loop:** candidates are shown beside popular reference images (Google Images, saved locally, never committed, never fed to the model). Ben's visual notes become plate prompt edits tagged as visual tradition, and the plate is marked interpretive. The entry text stays sourced. Rejected: rewriting the entries to match popular imagery, which would break the sourcing rule. Also rejected: feeding the references to the model, which copies them, and they are someone else's copyrighted work.
- **The negative-prompt phrasing is under test.** The avoid list is written as "no X", which may invert under Qwen's language-model encoder. Detail is in `plans/phase-2.md`.

## Ben's taste-review notes, 2026-10-27

- **Plates now follow Ben's visual descriptions,** informed by popular imagery (visual tradition), not the sourced appearance clauses. Every plate is marked interpretive, and the entries stay sourced. Rejected: editing clause by clause, which cannot change anatomy.
- **Baba-yaga's approved plate is withdrawn.** Ben found the arms and feet skeletal. The redo is frail and gaunt, not skeletal, with a very long nose, longer hair to the shoulders and nothing of iron.
- **Changes per creature:**
  - Zmey becomes a three-headed, four-legged winged dragon.
  - Leshy becomes an old man in moss with branch antlers.
  - Poludnitsa becomes a festival-dressed corpse with a torn jaw and a sickle.
  - Bannik becomes a small, wild, sinewy old man with a bath whisk and a bucket, with no victims.
  - Drekavac becomes hairless and skeletal, with bird legs and long clawed arms.
  - Domovoi becomes a cat-sized, bearded gremlin of a man.
  - Rusalka becomes a gaunt swamp spirit, with hair and weeds covering her.
  - Vampir becomes a gaunt aristocrat whose horror shows on a closer look.
  - Vodyanoi becomes a fat frog-man with a human nose and a mossy beard, with no hat.
- **Script still appears with the plain-noun negatives.** The next test removes the negated phrases from the positive prompt and the "study" and "sketch" words.

## Phase 3 decisions (2026-10-27)

- Ben: Astro for the site; book spreads with no page-flip animation; the agent prepares
  the public flip (licences, README, release notes, tag) but Ben performs it; the agent
  drafts the method page into the site for Ben to edit. Rejected: Next.js static export
  and plain Vite (more or less machinery than a ten-page site needs); page-flip
  animation (heavier, worse on phones, and the agent cannot judge the feel); a gallery
  grid (drops the book); the agent flipping visibility overnight (irreversible).
- Planner, vetoable: MIT for code, CC BY 4.0 for data and plates (closes the open
  licence item). Rejected: Apache-2.0 for code (patent clause is noise for this repo);
  CC BY-SA for data (share-alike would stop the plates being used in a print book
  without relicensing the book). Applied in 3e: `LICENSE` (MIT), `LICENSE-DATA` (CC BY
  4.0 over `data/`, `plates/slavic/` and `schema/`); the corpus under `sources/pages/` is
  public domain and `style/refs/` is PD-Art, each said in its own README or manifest.
- Planner, vetoable: every spread states that the plate is a drawing after the folk
  tradition and shows the sourced appearance clauses beside it, so the interpretive
  split is visible on the page rather than buried in `image.interpretive`.
- Shipping rhythm (Ben, in conversation): the unit of release is the volume, not the
  entry. v0.1 is the ten; v1.0 is Slavic complete; later volumes are their own releases.
- Planner, 3c: a creature that has appearance clauses shows them on the left page, so its
  `scene` clauses go in a right-page "Scene" section after "Behaviour and habitat" (8 of
  the 10 spreads). Unseen creatures keep their scene clauses on the left page. Rejected:
  dropping a seen creature's scene clauses from the page, because a sourced clause must
  not vanish from what the reader sees.

## Next-phase candidates (recorded 2026-10-27, at the close of Phase 3)

Not scheduled. The reasons for most of them are in `docs/pilot-report.md`.

- Slavic batch scaling: the remaining 100 to 150 Slavic creatures under the v2 prompts,
  released as v1.0 (the volume is the unit of release).
- Coverage pass: sample uncited pages for name variants and omissions the verify stage
  cannot see. Seven of the ten v2 drafts stopped with relevant pages unread.
- People-mapping table (\*): settle Little-Russia, Lusatia, Ruthenians, Kief/Chernigof,
  South-Russian and Kharkov once, before each batch entry guesses.
- R2 and release zips: the full-resolution PNGs go to a Cloudflare R2 bucket and a GitHub
  Release zip, as settled in Phase 2. Not done in Phase 3 (no spend).
- Hugging Face mirror of the dataset.
- Agent-readable layer: a form of the dataset and method aimed at agents, beyond the
  static JSON API under `/data/slavic/`.
- Máchal 1918 deep links (from 3c-2): the site's chip deep links rely on archive.org's
  page labels. Switching `machal1918` to `page_label_source: "header"` (the open item
  above) would turn its deep links off until a leaf-index mapping is verified. No pilot
  citation is affected today: cited labels are 231 to 271.
- Author email at the flip (from 3e): the git author email is on every commit and becomes
  public when the repo is flipped. Changing it means rewriting history, which is Ben's
  call. The lighter option is the GitHub noreply address for future commits only.


## Public name and launch (2026-10-28)

- **The public name is Old Wives** (as in "old wives' tale", without the tale). The
  site title is "Old Wives: a field guide to Slavic folklore creatures", the GitHub
  repo is `brac/old-wives`, and the npm package names follow. Rejected: "Beasts", the
  working name from Phase 3, which stays in the historical plans and reports and in the
  local folder name. The `v0.1.0` tag predates the rename.

## Phase 4 decisions (2026-10-28)

- Ben: plates keep coming from his visual-tradition text. The pilot's agent-drafted
  descriptions produced plates that did not match the creature as commonly pictured, so
  the pipeline does not author the visual text; Ben does, by dictation, and each text is
  a logged human edit. Rejected: agent drafts that Ben edits (the drafts were not a
  usable starting point in the pilot), and any fully automatic visual text.
- Ben: the review desk takes spoken notes (Web Speech API first, fal Whisper if names
  are mangled). Rejected: typed notes, and continuing to dictate into chat and hand-edit
  JSON.
- Ben: the next phase is one phase with three lanes (people table and text batch, review
  desk, site design review), stopping at 30 creatures, then the LoRA. Rejected: three
  sequential phases, and running to 150 before measuring cost and review load.
- Planner, vetoable: a spoken note is turned into a revised visual text by a small model
  and shown as a diff for approval; the model edits Ben's words only. The people table
  is applied from this tranche on and the pilot entries are not re-run. The coverage pass
  moves to the second tranche. The style LoRA is for look consistency and is judged by
  redraws-to-approval, not by taste alone.


## Phase 4a (2026-10-28)

- **People mapping table settled.** `sources/peoples.json` (schema
  `schema/peoples.schema.json`) has one row per source term: the people it is recorded
  as, the reasoning, whether it is contested, what a reader might object to, and how the
  pilot entries' existing flags would change under it. Six rows are contested (Ruthenians,
  Kief and Chernigof, Kharkov, South-Russian, Afanasyev's "у насъ", Frombald's
  "Rätzisch"), and the site's about page lists them. Kief, Chernigof and Kharkov are
  recorded as Ukrainians, as governments of Little-Russia. Rejected: the pilot's context
  rule for them (Russians, because Ralston writes of Russian peasants), which filed
  Kharkov as Russians in vampir and as Ukrainians in rusalka; the table needs one answer.
  Ruthenians are recorded as Ukrainians; rejected: Rusyns as a separate people value, and
  leaving the term unmapped as domovoi did.
- **Prompts draft-v2.1 and verify-v2.1 are a scoped change.** Each gains one paragraph:
  the draft maps every people term through the table and notes, without mapping, a term
  the table lacks; verify checks each people against the table and removes one resting
  on an unlisted term. This adds a lookup. It does not change what counts as a claim,
  what a clause may say, or how a grade is reached, so the tranche stays comparable with
  the pilot under draft-v2 and verify-v2. The pilot entries are not re-run; their
  existing flags stand.
- **Validator rule R-PEOPLE.** Every `people` value and every item of a `peoples` list
  must be a `people` value of the table, at both stages. All ten pilot entries pass.
- **2026-10-28, 4b-peoples: the terms batch 1 met are in the table.** New rows: Afanasyev's
  "нашей, наше" ("our"), Perm, Kostroma and Saratov Governments, Voroneje Government,
  the Poshekhonye district, "На Руси", "великорусскій" (Great Russian), "словенской" and
  Montenegro. Spellings added to existing rows: "Little-Russian" and "малорусскій"
  (Little-Russians), "South Russia" (South-Russian), "кіевской и черниговской губ."
  (Kief and Chernigof), Croatia (Croatians), Bulgaria and "болгары" (Bulgarians),
  "сербской" (Serbs). Four new contested rows: "our", which follows "у насъ"; Voroneje,
  whose southern districts were Little-Russian settlement; "словенской", which may mean
  Slavonic in general rather than Slovene; and Montenegro, recorded as a new people value,
  Montenegrins, with Serbs as the rejected alternative, since the 19th-century usage
  often counted them as Serbs. "Southern Slavs" and "South-Slavonian" get no row: the
  schema requires a people and an umbrella term is not one. A Great Russian government
  maps to Russians uncontested.
- **2026-10-28, 4b-peoples-2: the terms the later drafts met (oboroten, divozenka, dolya;
  skritek met none) are in the table.** New rows, all contested: Dalmatian (Croatians;
  Serbs rejected, since 19th-century usage often counted Dalmatian speech as Serbian);
  "Slavs in Istria" (Croatians, the majority and the first form Machal gives; Slovenes
  rejected, though the north of Istria was Slovene); Galicia (Ukrainians, as the
  Ruthenians of eastern Galicia and Ralston's Mavki; Poles rejected, though Afanasyev
  1868 p.343 pairs it with Poland and a Polish name); Hutsuls (Ukrainians, following the
  Ruthenians row). Spellings added to existing rows: "Great-Russian", "великорусскіе",
  "Великорусская" (Great Russian); "малор.", "малорусская", "малороссійскихъ"
  (Little-Russians); "Украйна" (the Ukraine); "Бѣлоруссія", "бѣлор." (White-Russia);
  "Сербы" (Serbs); "поляковъ", "Польшѣ" (Poles); "чеховъ", "чешскому", "Богеміи" (Czechs).
  **Reversed:** "На Руси" is now contested. On 1869 p.549 the page moves from "На Руси"
  to "На Украйнѣ и въ Бѣлоруссіи", which may be a contrast or a narrowing of an all-East-
  Slav statement, so the 4b-peoples reading (settled by 1868 pp.698-700) does not carry
  over. No row: Lett (not Slavic) and "Jugo-Slavs" (umbrella; the schema requires a people).
- **2026-10-28, 4b-peoples-3: rows list every form the corpus prints; a verifier matches a
  form, not a lemma.** verify-v2.1 matches people terms against the table exactly, so
  batch 1 lost sound content to spelling gaps alone: "Russia" and "Россіи" (kikimora),
  "Czechs" where the row had only "Czekhs" (vila), the adjective "Bulgarian" (divozenka's
  whole Bulgarian variant), "русское" and "русскимъ" (kikimora, oboroten), "Lusatian"
  and "Slovenian" (divozenka), and Karadžić's "Српски" (vila). Every uncontested row
  that maps to a people now carries the people noun, the adjective and the land name in
  English, and the inflected Russian, Serbian, Czech and Polish forms, in the
  orthography the sources print. Each added form was checked as a whole word in the
  corpus with the repo's normaliser; a form the corpus never prints was not added (so
  "Россія" is not listed: the corpus prints only "Россіи", "Россіей"). Left out as
  ambiguous: Wends/Wendish (Sorbs, or the Slavs of the Baltic coast generally), the
  Russian "словенскій" forms (Slavonic or Slovene; the "словенской" row stays contested),
  "словѣне" (the old Slavs), "лужица" (also "puddle"), Morava (also the river),
  abbreviations such as "серб." and "польск.", and the German and Latin glosses in
  Karadžić 1818. The Russians row's note now says "Russia" can mean the whole Empire.
  Contested rows are unchanged, so the about page is unchanged. Rejected: changing
  verify-v2.1 to match lemmas, which would change the frozen prompt mid-tranche and break
  comparability with the entries already verified under it.

## Phase 4c and 4d (2026-10-28)

- **Design review, planner defaults (4d), vetoable by Ben.** Body text stays 18px
  (rejected: 20px). Spread columns are 5fr / 4fr to favour the plate (rejected: equal
  columns, and a narrower 68rem spread). One chip per cite (rejected: smaller chips, one
  chip per clause). Variants stay closed (rejected: open by default). Contents thumbnails
  have the alt "Silverpoint study of <name>" (rejected: empty alt beside the visible
  name). Empty sections are hidden, heading and all (rejected: "Nothing in the cited
  sources."). "The name" heading and the CC BY gloss stay. The method page is in first
  person where the act was Ben's (rejected: third person).
- **Site typecheck is a gate.** `npm run check` runs `tsc --noEmit -p site`, and the site
  tsconfig resolves modules as NodeNext, which types the shared validator's ajv import
  the way Node loads it. Rejected: `@astrojs/check` (a new package; it would also cover
  `.astro` files, which are still unchecked), and Astro's default Bundler resolution.
- **The desk's note-to-edit model is `google/gemini-2.5-flash` through fal's
  `openrouter/router`**, on the key the pipeline already uses, capped at $0.50 in total.
  Rejected: a second provider or key.
- **The $1 plate cap is enforced in the desk** per creature: spend-ledger rows plus queued
  jobs plus the new job's estimate, checked at queue time and again before each real
  generate call. Queued dry runs count too. Rejected: relying on the generator's $25
  pilot total alone, which never stops a single creature. The desk's queue file,
  `plates/desk-queue.json`, is local state and is gitignored.
