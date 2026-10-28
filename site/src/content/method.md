---
title: Method
description: How the ten pilot entries and plates were made, what the checks found, and what the pilot cost.
---

# Method

This page describes the pipeline as it was actually run for the ten Slavic pilot
creatures, including the parts that did not work as planned. The numbers come from the
project's phase reports and style sheet in the repository.

## Why a pilot

The pilot took ten creatures end to end to find out whether the entry template, the
sourcing rules and the house style hold up before scaling to the rest of the Slavic
creatures. The ten were chosen to stress the pipeline, not because they are the ten most
famous: easy and hard sourcing, seen and unseen creatures, regional variants, several
names across several peoples, and a named individual of a class.

## Sources

Entries quote and cite public-domain works, mainly Máchal's *Slavic Mythology* (1918),
Ralston's *Songs of the Russian People* (1872) and *Russian Folk-Tales* (1873),
Afanasyev's *Poetic Views of the Slavs on Nature* (1865 to 1869) and Karadžić's Serbian
dictionary (1818, 1852). Modern scholarship is used for checking only.

## Draft and verify

Each entry passes through two separate agents, so that no stage grades its own work.
Both run from versioned prompt files kept in the repository.

1. **Draft.** The draft agent reads the sources for the creature and fills every field
   of the schema. Every clause is tagged with its source and page. It never writes an
   untagged claim; if a field has no source, it leaves it empty and says so.
2. **Verify.** A separate verify agent opens the cited pages and checks each tag: does
   the source actually say this? It removes or narrows clauses the page does not
   support, flags open questions, assigns the attestation grade, and writes the notes on
   pop-culture accretions and disputed points.

All ten creatures were drafted and verified twice: once under the first prompts, then
again under revised ones. The second version made the draft reconcile contradicting
appearance clauses (vodyanoi is described as bald and as long-haired, with two
different caps), which it does by sorting them into separate forms of the creature.

What verify found in the second run: out of 818 checked items it removed 3, narrowed
19, retagged 4 and flagged 30. None of the three removals was a false claim; each was
in the wrong field or was a style word. The low count gives no sign that the
drafts padded from memory. It does not show that nothing is missing: verify opens
only the pages a draft cites, so it cannot see omissions.

Each draft worked within a budget of about 100,000 tokens. Seven of the ten stopped with
relevant pages unread, mostly in Afanasyev, and each lists those pages in its notes. The
pilot accepts these gaps.

## Canaries

To test whether verify actually reads the pages, a false clause with a plausible tag
was planted in some drafts before verification: for example, that the domovoi wears a
tall felt hat, or that a vampire's eyes glow red when its grave is opened. Across both
runs, 5 of 5 canaries were caught on the evidence of the page. Only one of the five
tests was fully blind, though. In the others the verifier could tell from the
repository's state that the draft had been changed, so the result is weaker than 5 of 5
suggests.

## Attestation grades

Each entry gets one of four grades: widely attested, regional, literary or disputed
(definitions on the [data page](/data)). The ten landed as follows:

| Grade | Entries |
| --- | --- |
| Widely attested | baba-yaga, domovoi, leshy, poludnitsa, rusalka, vampir, vodyanoi |
| Regional | bannik, zmey-gorynych |
| Literary | drekavac |

Drekavac was expected to be regional. It rests on one article by Karadžić, printed in
1818 and again in 1852, which counts as one compiler. That is the grade system doing its
job, not a failure.

Two rules were set during the pilot: a single folklore collector counts as one source,
and Ralston counts as dependent on Afanasyev only where he cites him on the passage in
question. The two pull against each other. Wherever Ralston retells Afanasyev
without citing him, he counts as a second source, so the collector rule never takes
effect. Under the collector rule alone, bannik and zmey-gorynych would be literary. The
grades stand as they are for the pilot, and the rule may be revisited at scale.

## Appearance fields

The goal was that at least 8 of the 10 appearance fields would be clean enough to draw
from without rewriting. After the second run, 9 of 10 were. The exception is drekavac,
whose only appearance clause is "a four-footed animal".

## Plates

### Why silverpoint

The plates are monochrome silverpoint studies, after Leonardo da Vinci's metalpoint
sketches: fine grey lines and hatching on a plain off-white paper ground, with no colour.
A study suits a bestiary built from sources, because it reads as an attempt to record a
thing rather than as finished fantasy illustration. The fine line holds detail at
thumbnail size, and one medium keeps ten very different creatures looking like one book.

Rejected along the way:

- lubok prints, as too old-world;
- the illustrations from the Grimm television series, as too amateur;
- pen-and-ink engraving;
- a short colour palette. Every round that let colour in looked more like concept art
  and less like a study.

### Choosing a model

Four setups, built on three open-weights models on fal, were compared blind on
baba-yaga, bannik and zmey-gorynych. Qwen-Image won and was locked for the pilot. The
others:

- **Z-Image:** good hatching, but the structure made no sense.
- **FLUX.1 schnell:** the most complete, but it showed AI artefacts and read as a
  tattoo.
- **Qwen-Image edit with reference images:** it copied the reference drawing.

Two other models, FLUX.2 pro and Nano Banana Pro, were dropped before the bake-off
because their terms were ambiguous about releasing the output under CC BY 4.0.

### Drawn from the tradition, not the sources

The plates were not generated from the sourced appearance clauses. Editing those
clauses one by one could not change a plate's anatomy. Instead, each plate follows a
visual description written by Ben from the popular tradition, and is marked
interpretive in the data. The entries stay sourced. Each
plate was drawn on two seeds, compared with popular reference images kept locally, and
redrawn from Ben's notes until he approved it. He is the only visual judge; the
automated vision check the plan called for was replaced by his review.

### What the model does with words

Five review rounds taught a few rules about prompting:

- **Naming something draws it.** "No construction grid" drew a grid, and "no bigger
  than a house cat" put a cat beside the domovoi. To suppress something, leave it out
  of the prompt and add it as a bare noun to the negative prompt.
- **A named setting pulls in colour and photorealism.** A stove, a bathhouse or a lake's
  edge turned the plate into a painted scene. Style words at the end of a prompt lose to
  a vivid subject, so the style sentence comes first.
- **Quoted names and asides become lettering**, so the prompt builder strips them.
- **Say the anatomy plainly.** "Chicken legs" drew bird legs; "reverse-jointed legs, the
  knee bending backward like a dog's hind legs" drew the intended shape. "Skeletal" drew
  bare bones.
- **Lead with what the creature mostly is.** "A man with frog features" read as a man in
  a frog mask; "a big, blobby frog creature, only vaguely human" read as intended.

![Contact sheet of the ten plates](/og/contact-sheet.png)

## Cost

The pilot generated 126 images across the bake-off, a test grid and five review rounds,
and image spend reached $5.21 of a $25 cap. The draft and verify agents ran as Claude
Code subagents with no metered API spend; their effort was measured in tokens instead.

## What is still open

- A mapping table for nineteenth-century people labels, which are flagged per entry for
  now.
- A second source for drekavac, which needs a better scan of the Serbian material.
- A way to plant canaries that a verifier cannot detect.
