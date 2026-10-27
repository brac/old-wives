# Slavic pilot, Phase 1d report: the v2 re-run

Written 2026-10-27 at the end of milestone 1d-c: all ten creatures re-drafted and re-verified under
draft-v2 and verify-v2. v2 numbers are from `npm run stats` on main, v1 from `npm run stats` in a
scratch worktree of tag `phase-1c`; both reconcile for all ten. Costs: `.phase-loop/reports/1d-costs.csv`.

## Summary

- **Verify still removes little:** 3 of 818 items outside the canaries, all misplaced or style-only,
  two of them in the 1d-c fix round. Downgraded 19, retagged 4, flagged 30, re-formed 0.
- **Appearance forms work:** 37 forms across six creatures; vodyanoi's conflicts sit in separate forms.
- **One grade moved: bannik went from literary to regional.** Zmey-gorynych stayed regional, although
  Ben's collector ruling expected literary. The Ralston per-passage rule caused both.
- **Both v2 canaries were caught on page evidence**, and both tests were semi-blind.
- **Drafts used 83k to 118k tokens each ($0.33 to $2.37 at the bounds);** seven stopped with pages unread.
- **Question 1: 9 of 10 appearance fields are clean, up from 8.** Only drekavac is not clean.

## Stats, v1 and v2 side by side

Cells show v1 / v2. Draft items include the planted canary, and v2 also counts `family` (nine
creatures), so draft totals are not like for like; their swings follow which pages each budget-capped
draft reached. Removed leaves out the canaries. v1 had no forms and no `reformed`. "widely" is widely-attested.

| Creature | Draft items | Removed | Downgraded | Retagged | Reformed | Flagged | Grade | Forms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| baba-yaga | 63 / 81 | 1 / 0 | 1 / 0 | 0 / 1 | - / 0 | 3 / 4 | widely / widely | 0 / 0 |
| bannik | 20 / 19 | 0 / 0 | 0 / 1 | 0 / 0 | - / 0 | 1 / 1 | literary / **regional** | 0 / 0 |
| domovoi | 103 / 128 | 0 / 0 | 1 / 4 | 0 / 0 | - / 0 | 3 / 3 | widely / widely | 0 / 9 |
| drekavac | 9 / 7 | 0 / 0 | 3 / 0 | 0 / 0 | - / 0 | 3 / 1 | literary / literary | 0 / 0 |
| leshy | 147 / 113 | 0 / 0 | 1 / 3 | 1 / 0 | - / 0 | 5 / 3 | widely / widely | 0 / 10 |
| poludnitsa | 105 / 98 | 0 / 1 | 1 / 1 | 0 / 0 | - / 0 | 5 / 3 | widely / widely | 0 / 0 |
| rusalka | 112 / 107 | 0 / 1 | 2 / 1 | 0 / 2 | - / 0 | 4 / 1 | widely / widely | 0 / 2 |
| vampir | 101 / 98 | 0 / 0 | 1 / 1 | 0 / 1 | - / 0 | 5 / 5 | widely / widely | 0 / 4 |
| vodyanoi | 127 / 129 | 1 / 1 | 5 / 3 | 0 / 0 | - / 0 | 6 / 1 | widely / widely | 0 / 7 |
| zmey-gorynych | 38 / 38 | 0 / 0 | 2 / 5 | 0 / 0 | - / 0 | 4 / 8 | regional / regional | 0 / 5 |
| **Total** | **825 / 818** | **2 / 3** | **17 / 19** | **1 / 4** | **- / 0** | **39 / 30** | | **0 / 37** |

## What each rule change did

**Appearance forms.** In v1, vodyanoi had 20 top-level clauses with direct conflicts. In v2 it has
19 clauses in 7 forms and no common clauses: `machal-bald-reed-cap` (5), `naked-old-man` (3),
`afanasyev-log-rider` (4, with the sedge boyar's cap), `green-haired` (2), `human-in-village` (3),
`fish-tailed` (1) and `pike` (1), so bald and green-haired, and the two caps, never share a form. Domovoi gained 9 forms, leshy 10 (plus 3 common clauses), rusalka 2, vampir 4
(plus 2 common) and zmey-gorynych 5. Forms exist only at the top level, because variant appearance
cannot carry them. So poludnitsa's `bohemian` variant (an airy white lady, an old woman, a girl of
twelve) and its `lusatian` variant (a tall old woman, a young female) still mix figures.

**Checkable family.** The drekavac draft itself set `unclassified` (the page "says nothing of the
dead"), so verify removed nothing. The other nine keep their v1 values, now with accepted cites.

**The collector rule and the Ralston per-passage rule.** Grade changes from v1, with the v2 verifier's reason:

| Creature | v1 | v2 | Reason |
| --- | --- | --- | --- |
| bannik | literary | regional | one people and two authors: Ralston p.123 cites no source, so it counts as independent of Afanasyev |
| zmey-gorynych | regional | regional (ruling expected literary) | two authors: Ralston's Afanasyev footnotes attach only to stories the entry does not use |
| drekavac | literary | literary | one Karadžić article (1818, repeated 1852): one compiler, one people |

The other seven stay widely-attested. **The two rules pull against each other.** The collector rule
counts one collector printing folk texts as one source; the Ralston rule (kept as written by Ben)
counts Ralston as independent wherever he does not cite Afanasyev on the passage. Each uncited
retelling makes Ralston a second source, so the collector rule never bites. Bannik's Ralston p.123
follows Afanasyev p.69 closely (same order, same Smolensk detail) without citing him. Under the
collector rule alone, bannik and zmey-gorynych would both be literary. Leshy's grade has a separate dependency: it rests on one Ralston passage mapped from
Little-Russia to Ukrainians, and without that mapping, which Ben deferred, it drops to regional.

## Canaries

| # | Entry and pointer | Planted text | Tag | Caught | Blindness |
| --- | --- | --- | --- | --- | --- |
| A | poludnitsa `/variants/2/appearance/2` | She wears a wreath of cornflowers on her head. | machal1918:p.267 | yes, on page evidence | semi-blind |
| B | vampir `/appearance/10` (form `exhumed-corpse`) | When a vampire's grave is opened, its eyes glow red. | ralston1872:p.413 | yes, on page evidence | semi-blind |

Neither was committed, but the harness hands every subagent the git status, and both verifiers saw
their draft marked `M`. Neither called the clause planted, so both catches rest on page evidence.
Across v1 and v2, 5 of 5 canaries were caught; one test of the five was fully blind.

## Budget

Tokens are per-agent totals from the harness, with the input/output split unknown. Floor: $4 per
million (Opus 5.5 input); ceiling: $20 per million (output). The true API cost of a multi-turn agent
depends on context re-reads and caching, which this does not capture. Ben's drafting cap is $1 per creature.

| Creature | Draft tokens | Draft cost | Verify tokens | Draft + verify cost | Stopped with pages unread |
| --- | --- | --- | --- | --- | --- |
| baba-yaga | 118272 | $0.47-$2.37 | 107723 | $0.90-$4.52 | yes |
| bannik | 92942 | $0.37-$1.86 | 83807 | $0.71-$3.53 | no |
| domovoi | 104550 | $0.42-$2.09 | 106019 | $0.84-$4.21 | yes |
| drekavac | 83474 | $0.33-$1.67 | 74803 | $0.63-$3.17 | no |
| leshy | 103011 | $0.41-$2.06 | 102118 | $0.82-$4.10 | yes |
| poludnitsa | 106241 | $0.42-$2.12 | 101634 | $0.83-$4.16 | no |
| rusalka | 110173 | $0.44-$2.20 | 101379 | $0.85-$4.23 | yes |
| vampir | 110252 | $0.44-$2.21 | 110214 | $0.88-$4.41 | yes |
| vodyanoi | 112130 | $0.45-$2.24 | 117106 | $0.92-$4.58 | yes |
| zmey-gorynych | 103223 | $0.41-$2.06 | 97551 | $0.80-$4.02 | yes |
| **Total** | **1044268** | **$4.18-$20.89** | **1002354** | **$8.19-$40.93** | **7** |

Totals are priced from token totals, so they can differ by cents from the sum of rounded rows. Every
draft is under the $1 cap at the floor and over it at the ceiling. Unread pages are mostly Afanasyev,
listed in each draft's scope note. The CSV's bake-off row (82829 tokens) is Phase 2b and left out.

## Question 1 re-run: ten appearance fields

A plate uses the common clauses plus one form; "clean" means generating from them without rewriting.
**Count: 9 of 10.** Zmey-gorynych stays drawable even if its one flagged clause goes.

| Creature | Form a plate would use | Clean? | Note |
| --- | --- | --- | --- |
| baba-yaga | none (13 common clauses) | yes | one figure; the iron nose, teeth and breasts are "sometimes" options |
| bannik | scene (2 clauses) | yes | the bath-house, with sounds from behind the stove |
| domovoi | `machal-old-man` (5) | yes | grizzled hair, flashing eyes, a hairy body, a cloak with a red belt |
| drekavac | none (1 clause) | **no** | "a four-footed animal": any plate would be invented |
| leshy | `ralston-own-shape` (Ben's pick, 6) plus 3 common | yes | horns, goat's feet, shaggy hair that is sometimes green, claws; his stature varies |
| poludnitsa | `polish` variant (Ben's pick, `poles` in v1) | yes | a tall woman, a white robe to her feet, a sharp sickle |
| rusalka | `full-grown-maiden` (14) | yes | green hair, a pale face, a white shift or green leaves |
| vampir | `exhumed-corpse` (9) plus 2 common | yes | rosy, soft, undecayed, new nails, blood in the mouth; borderline in v1 |
| vodyanoi | `machal-bald-reed-cap` (5) | yes | bald, a fat belly, puffy cheeks, a reed cap, a rush belt; **no** in v1 |
| zmey-gorynych | `ralston-winged-serpent` (Ben's pick, 3) | yes | winged, with three to twelve heads; only "fiery" (`/appearance/2`) is referent-flagged |

## Reviewer findings and process findings

1. **Two fix-round removals** the verifiers had missed: vodyanoi "He can transform himself in many
   ways" (a capacity, belongs in behaviour) and rusalka's Saratof "Described as hideous" (style only).
2. **Spot check: 20 of 20 supported** (seeded, two per creature). Notes: the OCR-garbled Karadžić page's
   Latin gloss still carries both drekavac clauses; vodyanoi's Afanasyev cite gives the mill damage only
   loosely (Machal carries it); "drown" fairly reads Machal's "draw him down into the depths".
3. **Verifiers ran git against their brief.** Zmey-gorynych's and leshy's each ran `git status --short`
   once to check the draft was untouched; both reported it and neither used it as evidence.
4. **Tags kept for partial support.** Vodyanoi's verifier kept tags whose page carries only part of a
   multi-tag clause; strict per-tag retagging would add about 6 retags. verify-v2 does not say which it intends.
5. **The s.v. leaf boundary.** `cite` with s.v. prints a single leaf, so the vampir draft could not read
   Karadžić 1818 Вукодлак past leaf 122. The tag grammar cannot reach leaf 123.
6. **Footnotes as lore.** The zmey-gorynych draft left out the Siberian Gorynych tale in a footnote on
   Afanasyev 1868 p.591, while the baba-yaga draft cited authors' footnotes for `names.meaning`.
7. **Ralston's "Snake" referents.** All 8 zmey-gorynych flags (`/appearance/2`, `/4`-`/8`,
   `/behavior_habitat/2`, `/3`) ask one thing: Ralston's "Snake" is general, and Goruinuich only "often"
   or "sometimes" his name. They cover 6 of the 9 appearance clauses.
8. **Re-forming went unused.** No verifier re-formed a clause, so that path is untested on real data.

## Open decisions for Ben

1. **Collector against Ralston rule:** does an uncited Ralston passage that tracks Afanasyev count as
   independent? (a) Yes, as now: bannik and zmey-gorynych stay regional. (b) No: both become literary.
2. **Ralston's "Snake":** do his general Snake passages count as Zmey Gorynych lore? (a) Yes: clear
   the 8 flags. (b) No: remove those clauses. That leaves 3 appearance clauses, and still a drawable winged serpent.
3. **Forms inside variants:** (a) allow `form` in variant appearance, so poludnitsa's Bohemian and Lusatian
   figures can separate; or (b) leave variants as they are, and plate only variants that hold a single figure.
4. **Footnotes as lore:** (a) allow citing a footnote that carries narrative; or (b) references only.
5. **Partial-support tags:** (a) accept them; or (b) require every tag to carry the whole clause.
6. **Cost measure:** (a) get each agent's input/output split so the $1 cap can be checked; or (b) a token ceiling.
