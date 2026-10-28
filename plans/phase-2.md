# Phase 2: style sheet, plates and the vision check

Stages 3 (generate) and 4 (check) of the brief for the ten pilot creatures, in the
silverpoint idiom Ben chose. The final plates are built from the v2 entries of Phase 1d.

Spec of record: `docs/Slavic Pilot Brief.md` (House style amended 2026-10-27), Ben's
answers in `docs/phase2-brainstorm.md`, and the rulings in `docs/BACKLOG.md`. Research:
`.phase-loop/research/` (fal-models, output-licence, open-models, style-refs).

## Milestones and dependency graph

```
2a refs: fetch 6 candidates + contact sheet ──> [Ben picks refs] ──┐
                                                                   ├─> 2b bake-off (4 arms x 3 creatures) ──> [Ben picks model]
2a' generation script (src/plates/) ───────────────────────────────┘
2b ──> 2c test grid (guides x paper, baba-yaga + bannik, 8 images) ──> [Ben picks; tokens LOCK]
2c + phase-1d ──> 2d ten plates + vision check + sizes + image field ──> [Ben judges all ten together]
2d ──> 2e style sheet ──> tag phase-2
```

2a and 2a' are one milestone for one agent (about an hour). It runs as a lane beside
Phase 1d-a, sharing no files with it. 2b and 2c spend money and need Ben's eye, so they
run serially. 2d waits for Phase 1d to be tagged, because final plates come only from the
v2 entries.

## Settled decisions (do not relitigate; the planner's choices are vetoable by Ben)

- **Models (Ben):** Qwen-Image, Z-Image base and FLUX.1 [schnell], all on fal, all Apache
  2.0 weights. FLUX.2 pro, Nano Banana Pro and Recraft V4 are out (see the backlog).
- **Bake-off arms (planner).** The open models' reference inputs are image-to-image or
  edit endpoints, not true style references, so a reference image risks being copied
  rather than used as style. The bake-off therefore has four arms:
  - the three models, text only (style tokens plus appearance text);
  - Qwen-Image edit-plus, given Ben's chosen refs plus the same text.

  That is 4 × 3 = 12 images, about $1. Rejected: refs on every arm. Z-Image and schnell
  take one image only, and the schnell reference variant's licence is unverified.
- **Bake-off text:** the v1 verified appearance (or scene) clauses for baba-yaga, bannik
  and zmey-gorynych. Ben allowed v1 text for these three in answer D1. At most 10 clauses,
  ranked by support count (independent sources, then pages), using one form. The first
  draft of the positive and negative tokens is in brainstorm C1 and C4, and they are
  appended verbatim. Negative tokens go to `negative_prompt` where the endpoint has one;
  otherwise they are appended as "Avoid: …".
- **Size:** each model's native 3:4 portrait size, with no upscaling (Ben, 2026-10-27).
- **Seed:** one fixed seed for the whole bake-off, recorded. The seed is best-effort
  reproducible, so every output also logs the fal request id, the endpoint id, the
  date and the cost.
- **Ben is the visual judge.** No agent and no planner judges a plate by looking at it.
  Agents check only mechanics: file exists, dimensions, aspect ratio, cost, metadata.
  Contact sheets are private Artifact pages that the planner publishes from files the
  agent writes.
- **Reference handling:** the six candidates are downloaded at full resolution into
  `style/refs/candidates/`, with source URL, licence template, author and dimensions in
  `style/refs/manifest.json`. Mounts and inscriptions are not cropped until Ben has
  picked; a crop is a visual judgement, so it is done to Ben's instruction.
- **Spend:** the pilot cap is $25 in total. The script refuses to run if the running
  total in `plates/spend.json` plus the job's estimate would pass $25.

## Pinned dependencies

- `@fal-ai/client@1.10.1` (exact). This is the only new package. The 1.11 alphas are not
  allowed.
- `FAL_KEY` comes from the gitignored `.env`. Load it with `tsx --env-file=.env`; never
  print it, log it or commit it.

## Files (2a)

- `style/refs/candidates/<n>-<slug>.<ext>` x6, plus `style/refs/manifest.json`.
- `src/plates/prompt.ts`: builds the prompt text mechanically from an entry, using a
  given form or variant, with the 10-clause cap by support, the style tokens and the
  negative tokens. Returns `{ prompt, negative, clauses_used, clauses_dropped }`. This is
  a pure function with unit tests.
- `src/plates/generate.ts`: the CLI. Arguments: `--arm <id> --entry <path> [--form <id>]
  [--refs <files>] --out <dir> --seed <n> [--dry-run]`. It calls `fal.subscribe` and
  writes the PNG plus a sidecar `<name>.json` holding the endpoint, request id, seed,
  size, prompt, negative, clauses used and dropped, cost, date and licence name. With
  `--dry-run` it prints the prompt and the cost estimate and spends nothing.
- `src/plates/arms.ts`: the four arm definitions, each with endpoint id, size,
  per-image cost formula and licence name.
- `plates/spend.json`: the running ledger.
- `test/plates.prompt.test.ts`.
- `package.json`: the dependency plus one script, `plates`. This is the only edit.

2a generates nothing. 2b's agent runs the twelve generations after Ben has picked the
refs.

## Stop conditions (2a)

| Command | Expected observable | Hard or print |
| --- | --- | --- |
| `npm run check` | exit 0 | hard |
| `npm run plates -- --arm qwen --entry data/entries/baba-yaga.json --out <scratch> --seed 1 --dry-run` | the prompt is printed, holds no word absent from the entry apart from the tokens, and has at most 10 clauses; estimate ≤ $0.10 | hard |
| `node -e` check of `style/refs/manifest.json` | 6 rows, each with a licence template beginning `PD`, and each file present | hard |
| `git status --short` | no `.env`, and no `*.full.png` staged | hard |
| Phase 0 and 1 gates (`npm run validate` over data, `npm run stats`) | unchanged from `phase-1c` | hard |

## Out of scope

- Any paid generation in 2a.
- Cropping or editing a reference image.
- The schema's `image` field (2d).
- Anything in Phase 1d's file set: `prompts/`, `schema/`, `src/validate/`,
  `src/report/`, `data/`.
- Do not commit. The reviewer commits after approval.

## Report format

Write the report using the phase-loop `templates/milestone-report.md`, to the path named
in the brief.

## Post-review amendments

- (none yet)
- 2026-10-27: Ben picked style references 2, 3 and 5 by eye, to be used with no crop. They are committed under `style/refs/`, and the manifest marks them `chosen`. The qwen-edit-refs arm passes all three.
- 2026-10-27: zmey-gorynych's v1 bake-off text mixes the serpent, youth and warrior forms. For the bake-off only, the planner restricts it to the serpent clauses in a bake-off copy, recorded in each sidecar. Final plates use the v2 forms. Rejected: sending the mixed prompt, which would make a composite monster.
- 2026-10-27: Bake-off verdict (Ben, blind): Qwen-Image (arm qwen) is locked for the pilot. Its faults go to the test grid and regenerations: baba-yaga's nose reads as a cap, and zmey-gorynych came out a blob with text along the top. Rejected: Z-Image (no structural sense), FLUX.1 schnell (AI artefacts, reads as a tattoo) and the Qwen edit arm (copied the reference). See BACKLOG.
- 2026-10-27: The 2c test grid runs on baba-yaga and zmey-gorynych (the serpent-only v1 copy), not bannik, because Ben found every bannik scene plate too abstract and the scene-plate approach is open with him. Planner's call, vetoable. Rejected: spending grid images on a plate type whose concept may change.
- 2026-10-27: Unseen-rule amendment (Ben): a scene plate may show a minimal invented presence of the creature. 2d builds it mechanically: scene clauses, plus the best-supported behaviour clause, plus one fixed, creature-neutral presence token, with `image.interpretive: true` and a caption note. This applies to bannik and to any plate built from scene clauses. Rejected: an empty scene, and a sourced act with the creature unseen.
- 2026-10-27: Grid verdict (Ben).
  - **Guides off and plain paper are locked.** The difference was visible on the serpent and invisible on baba-yaga.
  - **Baba-yaga human edit:** her prompt drops "Her nose is sometimes described as being of iron." (the model draws it as a metal cap) and the lying-in-the-hut clause (a posture in a setting). Both are logged in the sidecar. Her bony leg did not show; it is a v2 clause the v1 grid text lacked.
  - **Every zmey-gorynych image fails** on generated script and lettering, and on anatomy. Planner's diagnosis: "study sheet" and "Renaissance sketch" pull in Leonardo-style handwritten annotations. The v1 serpent text also carried Afanasyev's literal "twelve serpent trunks", which v2 keeps in a separate form.
  - **Fix:** remove "study sheet" from the tokens, add explicit no-script negatives, and use v2's ralston-winged-serpent form only. Then run a small iteration batch (zmey ×4 seeds, baba-yaga ×2) before the ten plates. Rejected: changing the model again.
- 2026-10-27: Iteration 1 verdict (Ben).
  - **Baba-yaga is approved:** `plates/iter1/out/baba-yaga/s1` (Qwen-Image, v2 entry with Ben's human edit, guides off, plain paper, seed 1) is the final plate. Seed 2 was rejected because the cane bends unrealistically.
  - **Every zmey-gorynych seed fails.** All carry generated script, and the visible words include "fiery" and the name. Seed 4 was closest (a floating head), then seed 1 (a misshapen head).
  - **Cause:** the prompt text itself. Qwen-Image renders quoted words and proper names as lettering.
  - **Fix (planner, vetoable):** the prompt builder sanitises the text it sends, leaving entries unchanged. It removes quotation marks and parenthetical asides, and replaces the creature's own names (its romanised and native forms from `names`) with a neutral noun. The sidecar records the raw and the sent text. Rejected: per-creature human edits for each name, which do not scale.
- 2026-10-27: 2d-b generates the remaining eight creatures on 2 seeds each, plus zmey-gorynych on 4 new seeds under the sanitiser, so that Ben picks from all of them on one sheet. The image check, the size variants and the `image` field follow his picks. Rejected: running the full pipeline per plate before Ben has seen any.
- 2026-10-27: Candidate verdict (Ben) and 2d-c scope.
  - **Colour leaks.** Leshy, domovoi, rusalka and vampir came out with colour; baba-yaga is monochrome. **Ruling: monochrome only.** Colour words in an entry (a red shirt, green hair) stay in the entry and are drawn as tone. Rejected: allowing colour (it would break the silverpoint idiom and force a baba-yaga regeneration) and a single muted tint (it would need a new style test).
  - **Zmey-gorynych still carries script on all four seeds (s11 to s14),** even under the sanitiser. Seeds 11 and 12 were otherwise good.
  - **Planner's diagnosis:** the negative prompt is phrased as negations ("no colour, no text, no script"). A negative prompt lists what to steer away from. Qwen-Image's text encoder is a language model that reads negation, so "no text" in the avoid list plausibly steers toward text and colour. **Test (Ben approved, $0.16):** rerun zmey s11 to s14 with the negative tokens as bare nouns. Rejected: folding the fix silently into the next round, which would leave the cause unmeasured.
  - **Visual tradition.** Ben found that popular images differ from the sourced descriptions; for example, Zmey is commonly a four-legged, two-winged, three-headed dragon. Ben is the taste bottleneck. **Workflow (Ben approved):** a review sheet shows, per creature, our candidates beside about six popular reference images, taken from Google Images in Ben's Chrome, plus the source text. Ben's notes become prompt edits in `plates/overrides.json`, tagged as visual tradition, with the plate marked `interpretive`. The entry text stays sourced and unchanged.
  - **Reference images are for Ben's eyes only.** They are never sent to the image model (the bake-off showed Qwen edit copies references), never committed, and never put in the dataset. They live in a gitignored folder.
  - Rejected: Wikimedia Commons only (clean licences but missing the zeitgeist Ben is reacting to), and plain links (no side-by-side view).
- 2026-10-27: Taste-review verdict (Ben, on the 2d-c review sheet) and 2d-d scope.
  - **The script is not fixed by the plain-noun negatives.** Every new zmey seed still carries text; poludnitsa s12 has script in the corners; domovoi s12 shows a grid. **Planner's next diagnosis:** the positive prompt itself still names the unwanted things. Guides off sends "no construction grid, no measuring marks" as a positive token, so the grid and the marks are named in what to draw. "Study", "sketch" and "Renaissance" also pull in Leonardo-style notebook pages, which carry handwriting. **Test:** two style sets on every 2d-d plate.
    - Style a: the current tokens with the negated guides phrase removed.
    - Style b: also drops "study", "sketch" and "Renaissance", and adds "plain empty background".
  - **Ben's visual descriptions replace the sourced clauses as each plate's subject** (visual tradition, `interpretive: true`), for all ten creatures, including a redo of baba-yaga. Her approved plate came out with skeletal arms and feet, from "very bony of limb" and "bony leg", and the source text carried two iron clauses. The entries stay sourced and unchanged; the plate prompt comes from `plates/overrides.json` `visual`. Rejected: per-clause drops and adds, which cannot reach a different anatomy (zmey's four legs and three heads).
  - **Colour words in Ben's descriptions are written as tone or dropped** under the monochrome ruling. For example, the rusalka's green hair becomes dark, wet hair.
  - **Names of works are kept out of prompts.** The vampir description blends two well-known screen vampires in generic terms: a gaunt aristocrat, long nails and a trickle of blood. It names no film, novel, actor or character, because names get lettered into the image and because an actor's likeness is not ours to draw.
  - **2d-d:** 10 creatures × seeds 21 and 22 × style a and b, making 40 images (about $1.60). Ben judges both the style set and the subject on one sheet.
- 2026-10-27: 2d-d partial verdict (Ben, on 8 of 40; fal ran out of credit, which Ben restored).
  - **Style a is locked.** Ben wants "study" kept, because it keeps the plates art-sketchy. Rejected: style b, which reads as uncanny photorealism.
  - **Zmey-gorynych is approved:** `plates/iter2/out/zmey-gorynych/a-s21`. The wings are cropped at the sides, which Ben accepts.
  - **Baba-yaga is still not right.** The nose is not long enough and she reads as a sad old woman. Her `visual` text is rewritten to be scarier and more witch-like, with an enormous nose.
  - **2d-e** finishes the round in style a only: baba-yaga with the new text, plus the eight creatures not yet generated, each on seeds 21 and 22 (18 images, about $0.72). The review sheet carries the Google reference images again.
  - The 24 ledger rows refused with 403 (out of credit, not billed) are set to $0 with a note. The vampir `negative_extra` drops the colour word.
- **2d-e verdict (Ben, 2026-10-27).**
  - **Baba-yaga is approved:** `plates/iter2/out/baba-yaga/a2-s21`. Ben notes the nose reads slightly AI-made (too many nostrils) but accepts it for the pilot.
  - **Zmey-gorynych approval is confirmed** at `a-s21`.
  - **Every plate must show the whole figure.** Baba-yaga and leshy were cropped at the feet. Each rewritten `visual` text now ends with an explicit full-length clause (head to feet inside the frame, empty paper around it).
  - **"Chicken legs" means reverse-jointed (digitigrade) legs,** not literal bird legs. This is written as such for drekavac and for leshy, whom Ben also described with chicken legs.
  - **The other eight `visual` texts are rewritten from his notes:**
    - leshy: menacing rather than a friendly Santa, keeping the tree-like arm;
    - poludnitsa: a half-rotted corpse, not a skeleton, with the jaw hanging by a strip at the collarbone;
    - bannik: tiny, about the size of his bucket, and mischievous;
    - drekavac: fleshed, starved and humanoid, not a skeleton;
    - domovoi: wholly human, with no cat;
    - rusalka: long hair covering her breasts, entwined with plants, bare thighs, the lily kept;
    - vampir: no blood, no red, subtler fangs;
    - vodyanoi: a man who is part frog, with a human nose, wispy beard and head hair, and heavier webbing.
  - Each `note` field records Ben's reason.
- **2d-f** generates those eight on seeds 31 and 32 under `plates/iter3/out/` (16 images, 16 OK). The ledger stands at $4.17 of the $25 cap.
- **Round-three verdict (Ben, 2026-10-27): the plates drifted into colour, photorealism and painted backgrounds.**
  - Iter3 had the style words only as a suffix, and its descriptions named settings: a stove, a bathhouse, a swamp's edge.
  - A mechanical count of tinted pixels backs his eye. The share of samples with chroma above 0.12 was:
    - bannik about 63%;
    - rusalka 45–59%;
    - vodyanoi about 33%;
    - domovoi 24–31%.
    - For comparison, the approved baba-yaga scores 1.7%.
  - **2d-g** opens every `visual` text with a restated style sentence (a monochrome silverpoint character study, a single figure on plain off-white paper, Renaissance sketchbook).
  - It removes every setting and adds photorealism, background, scenery and interior to the negatives.
  - It folds in his per-creature notes:
    - poludnitsa has no lower jaw at all and solid white, rotted eyes, and is never happy;
    - bannik is not cute and has no bathhouse;
    - domovoi has no stove;
    - rusalka's hair alone covers her breasts, with no bikini top;
    - vampir's mouth is closed and teeth are never mentioned;
    - vodyanoi is a frog-human crossbreed with a frog head and frog skin, not a man in a mask.
  - Iter4 used seeds 31 and 32. Drekavac and domovoi also got 33 and 34, because 31 and 32 came back tinted (16–26%).
  - The review sheet shows the colour percentage per plate as information only; Ben's eye decides. The ledger is $4.969.
- **Round-four verdict (Ben, 2026-10-27).** Seven plates are approved:
  - baba-yaga `iter2/a2-s21`;
  - zmey-gorynych `iter2/a-s21`;
  - leshy `iter4/a-s31` (Ben said "looks good" without naming a seed; seed 31 was his earlier preference, so confirm);
  - bannik `iter4/a-s31` ("a little white; off-white preferred, but fine; stop spending on it");
  - domovoi `iter4/a-s33`;
  - rusalka `iter4/a-s31`;
  - vampir `iter4/a-s31`.
- **Rejected in round four:**
  - poludnitsa: one seed topless, the other a living woman with a tongue;
  - drekavac: a skinny man in odd poses;
  - vodyanoi: a man in a frog hat.
- **2d-h** rewrites those three:
  - poludnitsa: a half-rotted skull head with a flower crown, wispy hair, a detached lower jaw hanging by sinew and the tongue; fully clothed;
  - drekavac: a demon with reverse knees, a gaping mouth of needle teeth, bat-like ears and a sunken stomach;
  - vodyanoi: a blobby, bloated frog creature, only vaguely human, with a big belly.
  - Each was drawn on seeds 41 and 42 under `plates/iter5/out/`. The ledger is $5.209.
