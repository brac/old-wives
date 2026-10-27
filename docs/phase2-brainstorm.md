# Phase 2 brainstorm: what the planner needs from Ben

Written 2026-10-27, after Phase 1 closed (tag `phase-1`). Phase 2 is stages 3 and 4 of the
brief, generation and the vision check, plus the style sheet. Nothing in Phase 2 starts
until the questions below are answered, because they cover billing and visual judgement,
which belong to Ben.

**How to answer:** write each answer under its question, in the `Answer:` line. Leave a
line blank to mean "planner, propose something and bring it back to me". Commit and push.
The planner reads this file, records the settled decisions with their rejected
alternatives in `docs/BACKLOG.md`, and writes `plans/phase-2.md` from them.

Background reading, if useful: the "House style" and "Pipeline" sections of
`docs/Slavic Pilot Brief.md`, and the appearance table in "Question 1, provisional" in
`docs/pilot-phase1-report.md`.

## What the brief already fixes

These are settled, and they are listed here only so the questions below don't reopen
them:

- One plate per creature. Every plate shares one format, one rendering idiom and one
  palette, so the set reads as one book. Specimen or field-guide plate, not splash art.
- Lubok prints and Bilibin are the visual ancestors: the feeling, in an original style.
  Baba Yaga must be recognisable without being Bilibin's.
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

Answer:

**A2. Budget.** What is the spend cap for the pilot's ten plates, including regenerations
(up to 3 per plate) and the style exploration in section C? And what is the cap per plate
for the scaled batch of 100 to 150 creatures?

Answer:

**A3. Vision-check model.** The brief requires a vision model to compare each plate with
its appearance field. Your standing rule is that you are the visual judge and that the
planner does not judge screenshots by reading images. The proposal: the vision check
reports only mechanical mismatches (extra limbs, missing listed attributes, text
appearing in the image, wrong aspect ratio). It grades nothing on taste, and you judge
every plate yourself. Which model runs it, and is it billed separately?

Answer:

**A4. License.** Does the chosen provider's terms of service let us publish the output
under CC BY 4.0? The research agent will check, but it is your call if the terms are
ambiguous.

Answer:

## B. Plate format (one choice for all ten)

**B1. Aspect ratio and size.** Portrait 3:4 or 2:3 suits a book plate. Square suits a web
grid. What is the master resolution?

Answer:

**B2. Framing.** Full figure, centred, on a fixed ground line, so that every plate frames
its creature the same way? Or a fixed border or cartouche in the lubok manner?

Answer:

**B3. Scale cue.** The brief asks for "the same scale cue on every creature". What should
it be: a fixed human silhouette, a ruler bar, a tree or doorway, or nothing drawn, with
the scale given in the caption instead?

Answer:

## C. Style (lock before generating)

**C1. Rendering idiom.** Woodcut or lubok (flat colour, heavy outline), pen-and-ink
engraving, or gouache with Bilibin-style ornament? Do you have reference images? Put file
paths or links here, because a text answer is enough to start a search.

Answer:

**C2. Palette.** A fixed short palette, for example 4 to 6 named colours in the lubok
manner, or monochrome ink?

Answer:

**C3. The three open decisions: how do we test them?** The brief says to settle
lettering (a hand-lettered name and region), spot colour and background (blank or a
minimal setting) with the first plates. The proposal: generate one test pair of plates,
baba-yaga as a figure plate and bannik as a scene plate, in a small grid of options
(lettering on or off, spot colour on or off, blank or minimal background), and you choose.
The style tokens lock after your choice and before the other eight plates are made.
Note that a lettered name may be better added in post-processing than generated, since
image models still get text wrong. Is this test approach fine?

Answer:

**C4. Anti-stock-fantasy guard.** Zmey Gorynych and Baba Yaga must not look like stock
fantasy art. Are negative style tokens (for example "no painterly fantasy concept art, no
3D render") acceptable? They are fixed text, so the mechanical-prompt rule allows them.

Answer:

## D. Content questions the ten plates raise

**D1. Re-run under the v2 prompts first?** You ruled that the draft must reconcile
contradicting appearance clauses, and that `family` becomes checkable. The brief says that
if the template changes, the same ten are re-run before scaling. Do we:

- (a) re-draft and re-verify all ten under draft-v2 and verify-v2 before any plate is made,
  so the plates come from the final template; or
- (b) make plates now from the v1 entries, and re-run the text later?

The planner leans to (a): the plates are built from the appearance field, so making them
from v1 would mean making them twice.

Answer:

**D2. Vodyanoi.** Its appearance field is not clean (bald against long green hair, and two
different caps). If D1 is (a), the draft-v2 reconciliation should fix it. If D1 is (b), do
we skip its plate, or let you pick the clauses by hand and record that as a human edit?

Answer:

**D3. Drekavac.** Its whole appearance field is "a four-footed animal", so any figure would
be invented. Options: a scene plate (night, the scream, a Serbian village edge) under the
unseen rule, with no body shown; a plate held back until a second source is found; or a
deliberately minimal silhouette. Which?

Answer:

**D4. Leshy's form.** The brief says to use the most commonly attested form. The planner
proposes the "own shape": an old man with long hair and beard, horns, goat's feet, shaggy
hair that is sometimes green, and long claws. His size is left to the caption, because
stature appears three ways in the sources. Agree?

Answer:

**D5. Poludnitsa's variant.** Its appearance lives only in its six variants. The planner
proposes the `poles` variant (a tall woman, a white robe reaching to her feet, a sharp
sickle) set in the noon rye field, as the most consistent. Agree, or pick another?

Answer:

**D6. Picking clauses.** A plate can't show 28 leshy clauses. The proposal: the plate
prompt uses all the verified clauses of the chosen form, unless they exceed a fixed
maximum. Over that maximum, a rule picks them in order of support, and the dropped clauses
are logged in the entry. Is a mechanical rule like that acceptable, or do you want to pick
clauses per creature by hand?

Answer:

## E. Review loop

**E1. How do you want to see plates?** All ten pinned up together before judging any one
(the brief's question 4)? Options: a contact sheet in a private Artifact page, the files in
the repo under `plates/`, or both.

Answer:

**E2. Large files.** Do plates go into git directly, through Git LFS, or into an external
bucket with only the manifest committed?

Answer:

## Anything else

Answer:
