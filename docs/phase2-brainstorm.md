# Phase 2 brainstorm: what the planner needs from Ben

Written 2026-10-27, after Phase 1 closed (tag `phase-1`). Phase 2 is stages 3 and 4 of the
brief, generation and the vision check, plus the style sheet. Nothing in Phase 2 starts
until the questions below are answered, because they cover billing and visual judgement,
which belong to Ben.

**Answered 2026-10-27.** Ben's answers are on the `Answer:` lines below. Where an answer
says "planner's call", propose something and bring it back. The planner records the
settled decisions with their rejected alternatives in `docs/BACKLOG.md` and writes
`plans/phase-2.md` from them.

Background reading, if useful: the "House style" and "Pipeline" sections of
`docs/Slavic Pilot Brief.md`, and the appearance table in "Question 1, provisional" in
`docs/pilot-phase1-report.md`.

## What the brief already fixes

These are settled, and they are listed here only so the questions below don't reopen
them. **One exception:** the rendering idiom in the brief (lubok and Bilibin as visual
ancestors, engraving or woodcut feel) is superseded by section C below. The planner should
update the brief's "House style" section to match C1 and C2 and note the change in the
backlog.

- One plate per creature. Every plate shares one format, one rendering idiom and one
  palette, so the set reads as one book. Specimen or field-guide plate, not splash art.
- ~~Lubok prints and Bilibin are the visual ancestors: the feeling, in an original style.~~
  Superseded, see C1. Baba Yaga must still be recognisable without being Bilibin's.
- The prompt is built mechanically: the verified appearance field (or the scene field,
  for unseen creatures) plus fixed style tokens. No free-form prompt writing, and nothing
  in the prompt that the verified entry doesn't contain.
- The style tokens are locked for the whole pilot batch once they are chosen.
- Prompt, model and seed are stored in each entry's `image` field.
- The vision check compares each plate with the appearance field and the style sheet.
  A failed plate is regenerated up to three times, then escalated to Ben.
- Shapeshifters get the most commonly attested form, with a caption noting the shifting.
  No composite monsters.
- Lettering, spot colour and background are to be settled "with the first plates, not
  before". So section C below asks how to test them, not for a final answer.

## A. Model, provider and money (billing lever)

**A1. Which image model and provider?** The planner's starting shortlist is below, to
react to, not to accept as it stands; a research agent will check current versions and
prices before the plan is written. The things that matter for this project are a
reproducible seed, a stable model version that stays available for the whole batch,
license terms that let plates be published under CC BY 4.0, and how well the model holds
a print or engraving idiom.

- A hosted API with fixed seeds, such as fal.ai (already connected here) serving a FLUX
  model.
- A pixel-art service such as PixelLab (also connected). It is probably the wrong idiom
  for lubok, but you already pay for it.
- An image model that you already have a subscription for.

Answer: fal.ai, model chosen by a bake-off before anything is locked. Candidates:
FLUX.2 pro, Nano Banana Pro (Gemini image) and Recraft V4, all served on fal. Each gets
the identical verified appearance text plus 3 to 5 style reference images (see C1), for
three creatures: baba-yaga (figure plate), bannik (scene plate) and zmey-gorynych
(generic-fantasy risk). Nine images. Ben picks the winner by eye; the winner and its
version are locked for the batch. PixelLab is the wrong idiom and is out. A style LoRA
trained on approved plates is a later step, once about 30 plates are approved, and is not
part of Phase 2.

**A2. Budget.** What is the spend cap for the pilot's ten plates, including regenerations
(up to 3 per plate) and the style exploration in section C? And what is the cap per plate
for the scaled batch of 100 to 150 creatures?

Answer: Pilot cap $25, covering the bake-off, the C3 test grid, ten plates and up to three
regenerations each. Scaled batch cap $1 per plate including regenerations. The planner
records actual spend per plate in the entry's `image` field.

**A3. Vision-check model.** The brief requires a vision model to compare each plate with
its appearance field. Your standing rule is that you are the visual judge and that the
planner does not judge screenshots by reading images. The proposal: the vision check
reports only mechanical mismatches (extra limbs, missing listed attributes, text
appearing in the image, wrong aspect ratio). It grades nothing on taste, and you judge
every plate yourself. Which model runs it, and is it billed separately?

Answer: Proposal accepted. Mechanical mismatches only, no taste. Run it on whatever
vision-capable model the pipeline already uses for review; at ten plates it needs no
separate billing line. Add two checks to the list: the plate must be monochrome (see C2),
and it must contain no colour fill.

**A4. License.** Does the chosen provider's terms of service let us publish the output
under CC BY 4.0? The research agent will check, but it is your call if the terms are
ambiguous.

Answer: Generate only on commercially licensed endpoints: FLUX.2 pro (not the dev
weights), Recraft, Nano Banana. fal passes each model's license through on the endpoint
page; the research agent reads it and records the license name in the entry's `image`
field. If any candidate's terms are ambiguous about redistribution under CC BY 4.0, drop
it from the bake-off rather than argue it.

## B. Plate format (one choice for all ten)

**B1. Aspect ratio and size.** Portrait 3:4 or 2:3 suits a book plate. Square suits a web
grid. What is the master resolution?

Answer: Portrait 3:4. Master at the winning model's largest native portrait size, at least
2048 on the long edge. Web grid uses square thumbnails cropped from the plate, so the
figure must sit in the centre column (see B2).

**B2. Framing.** Full figure, centred, on a fixed ground line, so that every plate frames
its creature the same way? Or a fixed border or cartouche in the lubok manner?

Answer: Full figure, centred, on a fixed ground line, drawn on a plain paper ground. No
generated border or cartouche. Any frame, name or caption is added in post-processing or
by the site, never generated.

**B3. Scale cue.** The brief asks for "the same scale cue on every creature". What should
it be: a fixed human silhouette, a ruler bar, a tree or doorway, or nothing drawn, with
the scale given in the caption instead?

Answer: Nothing drawn as a separate object; scale goes in the caption. The drawing guides
in C1 (proportion lines, construction marks) may carry a faint scale mark if the model
produces one naturally, but it is not required and not prompted for.

## C. Style (lock before generating)

**C1. Rendering idiom.** Woodcut or lubok (flat colour, heavy outline), pen-and-ink
engraving, or gouache with Bilibin-style ornament? Do you have reference images? Put file
paths or links here, because a text answer is enough to start a search.

Answer: None of the three. The idiom is a **Renaissance silverpoint study**, in the manner
of Leonardo da Vinci's silverpoint and metalpoint sketches: a drawn study, not a print.
Lubok was considered and rejected as too old-world; the Grimm television show's
illustrations were considered and rejected as too amateur.

What the plate should look like:

- A sketch that is also well rendered. Visible evidence of drawing: searching construction
  lines, overlapping contour strokes, a few lines left where the hand moved, pentimenti.
  Not a clean vector outline, not a painting.
- Shading by hatching and cross-hatching, with the stroke direction following the form.
  No smooth gradients, no airbrush, no painterly blending.
- Sharper and higher contrast than the originals. Leonardo's sheets read foggy and faded
  today; ours should have crisp dark lines on a clean light ground, with the full range
  from fine light hatching to dense dark cross-hatching.
- Optional drawing guides around or over the figure: proportion lines, a faint
  construction grid, spacing marks, the kind of measuring marks found on a study sheet.
  These are part of the idiom and are welcome, but they must not become a border or a
  diagram; see C3 for how to test them.
- The figure is the subject of a study sheet. Blank ground around it; no scene unless the
  creature is unseen and gets a scene plate under the unseen rule.
- Baba Yaga must still be recognisable without being Bilibin's; the idiom change makes
  that easier, since Bilibin is a painter and this is a drawing.

Reference images: public-domain Leonardo silverpoint and metalpoint studies (the Windsor
and Biblioteca Ambrosiana sheets, Wikimedia Commons has high-resolution scans), plus one
or two Dürer or Holbein silverpoint heads for the sharper, higher-contrast end. These are
**style references only, never subject references**: no reference image may depict the
creature being drawn. Planner's call on the exact 3 to 5 files; put them under
`style/refs/` with their source URL and license in `style/refs/manifest.json`.

Style tokens (first draft, planner refines in the bake-off, then locks): "silverpoint
study, metalpoint drawing on prepared paper, Renaissance sketch, visible construction
lines, hatching and cross-hatching, fine line, high contrast, sharp focus, monochrome,
blank paper ground, study sheet". Negative tokens per C4.

**C2. Palette.** A fixed short palette, for example 4 to 6 named colours in the lubok
manner, or monochrome ink?

Answer: Monochrome for the whole first pass. No colour at all: a single dark drawing tone
(silver-grey to near-black) on a light paper ground, with the paper tone itself (warm
white, cream or a prepared pale tint) as the only variation. Colour is deferred until the
ten monochrome plates have been judged; it may never be added. The vision check enforces
monochrome (A3).

**C3. The three open decisions: how do we test them?** The brief says to settle
lettering (a hand-lettered name and region), spot colour and background (blank or a
minimal setting) with the first plates. The proposal: generate one test pair of plates,
baba-yaga as a figure plate and bannik as a scene plate, in a small grid of options
(lettering on or off, spot colour on or off, blank or minimal background), and you choose.
The style tokens lock after your choice and before the other eight plates are made.
Note that a lettered name may be better added in post-processing than generated, since
image models still get text wrong. Is this test approach fine?

Answer: Test approach fine, with the grid changed to fit C1 and C2. Lettering is decided
now: never generated, always post-processing or the site. Spot colour is off by C2. So the
grid for the test pair is: **drawing guides on or off** × **paper ground plain or lightly
prepared (tinted, with faint tooth)**. Four plates each for baba-yaga and bannik, eight
total, generated with the bake-off winner. Ben picks, the tokens lock, then the other
eight creatures are made.

**C4. Anti-stock-fantasy guard.** Zmey Gorynych and Baba Yaga must not look like stock
fantasy art. Are negative style tokens (for example "no painterly fantasy concept art, no
3D render") acceptable? They are fixed text, so the mechanical-prompt rule allows them.

Answer: Yes. Fixed negative tokens, locked with the positive ones. Starting set: "no
painterly fantasy concept art, no 3D render, no digital painting, no colour, no smooth
shading, no anime, no comic book inking, no photograph, no text, no watermark, no
border".

## D. Content questions the ten plates raise

**D1. Re-run under the v2 prompts first?** You ruled that the draft must reconcile
contradicting appearance clauses, and that `family` becomes checkable. The brief says that
if the template changes, the same ten are re-run before scaling. Do we:

- (a) re-draft and re-verify all ten under draft-v2 and verify-v2 before any plate is made,
  so the plates come from the final template; or
- (b) make plates now from the v1 entries, and re-run the text later?

The planner leans to (a): the plates are built from the appearance field, so making them
from v1 would mean making them twice.

Answer: (a). Re-run all ten under v2 before any plate is made. The bake-off in A1 and the
C3 test grid may use the v1 appearance text for baba-yaga, bannik and zmey-gorynych,
since those three are already clean, so that style work and the v2 re-run can proceed in
parallel. Final plates come from v2 entries only.

**D2. Vodyanoi.** Its appearance field is not clean (bald against long green hair, and two
different caps). If D1 is (a), the draft-v2 reconciliation should fix it. If D1 is (b), do
we skip its plate, or let you pick the clauses by hand and record that as a human edit?

Answer: Covered by D1 (a). If v2 still leaves a conflict, Ben picks the clauses by hand
and it is recorded in the entry as a human edit with the dropped clauses logged.

**D3. Drekavac.** Its whole appearance field is "a four-footed animal", so any figure would
be invented. Options: a scene plate (night, the scream, a Serbian village edge) under the
unseen rule, with no body shown; a plate held back until a second source is found; or a
deliberately minimal silhouette. Which?

Answer: Scene plate under the unseen rule. Night, the edge of a Serbian village, nothing
shown of the creature. No invented body and no silhouette. Do not hold the plate back; a
thin entry with an honest scene is what the literary grade is for. If a second source
turns up later, the plate is regenerated.

**D4. Leshy's form.** The brief says to use the most commonly attested form. The planner
proposes the "own shape": an old man with long hair and beard, horns, goat's feet, shaggy
hair that is sometimes green, and long claws. His size is left to the caption, because
stature appears three ways in the sources. Agree?

Answer: Agree. Own shape, size to the caption. "Sometimes green" is dropped from the prompt
by C2 (monochrome) and noted in the caption instead.

**D5. Poludnitsa's variant.** Its appearance lives only in its six variants. The planner
proposes the `poles` variant (a tall woman, a white robe reaching to her feet, a sharp
sickle) set in the noon rye field, as the most consistent. Agree, or pick another?

Answer: Agree, the `poles` variant in the noon rye field. The field is minimal; the figure
is still the subject of a study sheet.

**D6. Picking clauses.** A plate can't show 28 leshy clauses. The proposal: the plate
prompt uses all the verified clauses of the chosen form, unless they exceed a fixed
maximum. Over that maximum, a rule picks them in order of support, and the dropped clauses
are logged in the entry. Is a mechanical rule like that acceptable, or do you want to pick
clauses per creature by hand?

Answer: Mechanical rule. Cap of 10 clauses, chosen by support count (number of
independent sources, then page count), dropped clauses logged in the entry. Ben overrides
per creature only when a plate fails review, and the override is recorded as a human
edit.

## E. Review loop

**E1. How do you want to see plates?** All ten pinned up together before judging any one
(the brief's question 4)? Options: a contact sheet in a private Artifact page, the files in
the repo under `plates/`, or both.

Answer: Both. Files under `plates/` and a contact sheet as a private Artifact page, with
all ten up together before any one is judged. The bake-off and the C3 grid get their own
contact sheets.

**E2. Large files.** Do plates go into git directly, through Git LFS, or into an external
bucket with only the manifest committed?

Answer: Three sizes per plate, same stem: `<id>.web.webp` (1200 to 1600 on the long edge,
final size decided with the first page layout), `<id>.thumb.webp` (400), and
`<id>.full.png` (master). Web and thumb go into git under `plates/slavic/`. Full-res goes
to a Cloudflare R2 bucket on a `plates.` subdomain, mirrored at the same path, and is
also zipped per volume as a GitHub Release asset. No Git LFS. The entry's `image.plate`
field stores only the stem (`slavic/<id>`); consumers derive the URL for the size they
want. For the pilot, full-res may sit locally until the bucket exists, but it is never
committed.

## Anything else

Answer: Three things.

1. A "coverage" check belongs in the backlog. Verify only opens the pages a draft cites,
   so it cannot catch omissions. A later pass should sample uncited pages of each source
   for the creature's name variants and report hits the draft never used.
2. The grade rule as ruled (a collector counts as a compiler) makes zmey-gorynych
   literary. Fine for the pilot; expect to revisit once there are enough entries to see
   the grade distribution.
3. The style sheet produced in Phase 2 should include the chosen reference images, the
   locked positive and negative tokens, the bake-off contact sheet with the losing models
   noted, and one paragraph explaining the silverpoint choice, so that volume 2 can match
   volume 1 without re-deriving any of it.
