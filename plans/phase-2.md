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
