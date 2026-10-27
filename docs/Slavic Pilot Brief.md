# Slavic Pilot Brief — Folklore Bestiary

Oct 26, 2026 · @Engineer

## Purpose

Take ten Slavic folklore creatures end to end through the bestiary pipeline to find out whether the entry template, the sourcing rules and the house style hold up before scaling to the full Slavic batch (about 100 to 150 creatures) and then the world list (about 2,000 to 3,000).

The product this feeds: a passive, free, open reference in the spirit of word-atlas and Yokai.com. One consistently illustrated plate per creature, sourced lore, an open dataset (CC BY 4.0), no accounts, no game layer.

Success for the pilot means three things:

- At least 8 of the 10 appearance fields are clean enough to generate art from without a human rewrite.
- Every factual claim in every entry carries a source, and the attestation grade is defensible.
- The 10 plates read as one set at a glance, and Baba Yaga and Zmey Gorynych do not look like stock fantasy art.

## Scope rule

One test per entry: is anyone alive today supposed to be praying to it? If yes, it is out. If no, it is in.

- In: folk creatures and spirits, monsters from epics and tales, beings that were feared, avoided or appeased rather than worshipped.
- Out: anything in a living religion's canon or practice. For the Slavic batch this excludes the pre-Christian gods (Perun, Veles, Mokosh and the rest) and all Rodnovery neopagan reconstructions.
- Class vs individual: a kind of being can be in while a named, venerated member of that kind is out. Applied here: zmey (the class) is in, with Zmey Gorynych as its famous instance; neither has a cult, so both are fine.
- Appeasement is the tell. Milk left for the domovoi is fear management, not devotion. That is in.

The published scope note should state this rule plainly and list what was excluded and why. A visible, reasoned exclusion deflects most complaints before they are written.

## The ten creatures

Chosen to stress the pipeline, not to be the ten most famous. Each one tests something specific.

| # | Creature | Family | Region | What it tests |
| --- | --- | --- | --- | --- |
| 1 | Domovoi | Household | Russian, Belarusian | The easy path: deep sourcing, clear appearance, rich appeasement lore. Should come out clean. |
| 2 | Bannik | Household | Russian | The felt-not-seen rule. Rarely described; render the empty bathhouse at night rather than invent a body. |
| 3 | Rusalka | Water | Russian, Ukrainian | Regional variants: northern pale drowned women vs southern green-haired dancers in rye. How variants nest in one entry. |
| 4 | Vodyanoi | Water | Russian | Multiple competing descriptions from good sources (bloated old man, green beard, fish tail in some tellings). |
| 5 | Leshy | Forest | Russian | A shapeshifter on a single plate without inventing a canonical form. Shoes on wrong feet, no shadow, blue blood. |
| 6 | Poludnitsa | Field | Polish, Russian, Czech | One creature, several peoples, several names (poludnica, polednice). Multi-name, multi-region handling. |
| 7 | Vampir / Upyr | Undead | Serbian, Russian | The source-grade system. Karadzic 1818 and the 1725 Plogojowitz report are gold; Stoker-era accretions are not. |
| 8 | Drekavac | Undead | Serbian, Bosnian | Thin, regional, partly oral attestation. Expected to land on the regional grade. |
| 9 | Zmey Gorynych | Monster | Russian | Class vs named individual, and the generic-fantasy-art risk. Does the house style hold on a dragon? |
| 10 | Baba Yaga | Monster | Russian | The showpiece. An existing iconic look (Bilibin) to be distinct from without losing recognizability. |

Coverage: easy vs hard sourcing (1, 10 vs 7, 8); seen vs unseen (2, 5); variants and multi-nation names (3, 6); class vs individual (9); style stress tests (9, 10).

## Entry schema

Every entry is one JSON record with these fields. Two of them carry the project: the appearance field, which the art is generated from, and the attestation grade, which is what makes this a reference instead of a mood board.

| Field | Content | Rule |
| --- | --- | --- |
| names | Romanized primary name, native script(s), regional variants, meaning of the name | Variants list which people use which name |
| peoples\_regions | Specific peoples where attested (Russian, Ukrainian, Serbian), never just "Slavic" | One row per people, with source |
| family | household, water, forest, field, undead, disease and fate, monster, other | The browse axis; one value |
| appearance | Physical description as given in sources, each clause tagged with its source | No invented detail. Empty is allowed; see unseen rule |
| behavior\_habitat | What it does, where and when it is met | Sourced |
| dealing\_with\_it | Wards, offerings, taboos, appeasement | Sourced; the best storytelling column |
| origin | Where it comes from, who becomes one | Sourced |
| related | Often-confused or related beings, by id | Links within the dataset |
| attestation | One of four grades (below) | Assigned by the verify agent, not the draft agent |
| sources | Author, title, year, page or section, URL where public domain | At least one PD source per entry |
| image | Plate filename, generation prompt, model, seed, date | Prompt is built from appearance plus style tokens only |
| notes | Pop-culture accretions to exclude, disputed points, scope decisions | Where the vampir entry records the Stoker line |

Attestation grades:

1. Widely attested: multiple peoples, multiple independent sources.
2. Regional: one people, multiple sources.
3. Literary: traceable mainly to one 19th-century compiler; possible cabinet mythology.
4. Disputed: contested, or suspected modern invention.

Unseen rule: when sources give no appearance, the plate shows the scene (the bathhouse at night, the rye field at noon), not an invented body. The appearance field stays empty and a scene field holds the sourced setting instead. Amended 2026-10-27 (Ben): the data rule is unchanged, so no invented appearance enters the entry, but the plate may show a minimal invented presence of the creature in the scene. The image record marks it as interpretive, and the caption says so. Empty scenes read too abstract.

Variant rule: one entry per creature, variants nested inside it with their region and source. Rusalka is one entry with a northern and a southern variant, not two entries.

## Sources

Quote and cite from public-domain works; use modern scholarship for verification only. Confirm public-domain status before quoting anything at length.

| Source | Covers | Role |
| --- | --- | --- |
| Jan Machal, "Slavic Mythology", in The Mythology of All Races vol. 3 (1918) | All Slavic peoples, organized by creature type with regional variants | Spine of the batch; first stop for every entry |
| W.R.S. Ralston, Songs of the Russian People (1872) | Domovoi, rusalki, vodyanoi, the dead, witches | Primary English PD source for Russian household and water spirits |
| W.R.S. Ralston, Russian Folk-Tales (1873) | Baba Yaga, Koschei, zmey, tale-based creatures | Primary for the monster entries |
| A.N. Afanasyev, Poetic Views of the Slavs on Nature (1865 to 1869) | Russian, in depth | Agents read the Russian; cite by volume and chapter |
| Vuk Karadzic, Serbian Dictionary (1818, 1852) | Vila, vampir, vukodlak, drekavac and South Slavic beings | Primary for entries 7 and 8 |
| 1725 Plogojowitz report (Austrian administrative record) | Vampir | Earliest documentary vampire case; cite directly |
| Linda Ivanits, Russian Folk Belief (1989) | Russian spirits | Verification only; copyrighted |
| Polish demonology literature (Baranowski and successors) | Poludnica, Polish variants | Verification only; copyrighted |
| Wikipedia and Wikidata, Slavic legendary creature categories | The candidate list | List and cross-reference only, never a cited source |

The cabinet-mythology trap. Nineteenth-century Slavic mythology is riddled with romantic-nationalist reconstruction; scholars call it kabinetnaya mifologiya, mythology invented at a desk. The Book of Veles is a forgery. Many "ancient Slavic" beings online trace to one 1800s author or a 1990s neopagan site. Handling: every claim carries a source; a creature with a single literary source and nothing in collected folklore is kept and graded literary, not silently dropped or silently promoted. The grade is a feature of the reference, not a weakness.

## Pipeline

Five stages per creature, run as separate agent roles so no stage grades its own work. Expensive human minutes go to plate review and the hard cases, not to typing.

1. Draft. The draft agent reads the listed sources for the creature and fills every schema field, tagging each clause with its source and page. It never writes an untagged claim. If a field has no source, it leaves it empty and says so in notes.
2. Verify. A second agent that has not seen the draft reads the cited passages and checks every tag: does the source actually say that? It removes or flags unsupported clauses, assigns the attestation grade, and writes the exclusion notes (pop-culture accretions, disputed points).
3. Generate. The prompt is built mechanically from the verified appearance field plus the fixed style tokens. No free-form prompt writing. For unseen creatures, from the scene field instead. Prompt, model and seed are stored in the image field.
4. Check. A vision model compares the plate to the appearance field and the style sheet and reports mismatches (extra limbs, missing attributes, off-style rendering). Fails are regenerated up to three times, then escalated.
5. Review. Human pass on each plate and entry. Decisions recorded in notes so the next batch inherits them.

Run stages 1 and 2 for all ten before generating any art, so the appearance fields can be compared as a set. That comparison is the first real signal about whether the template is strict enough.

## House style

Consistency is the brand. Every plate shares one format, one rendering idiom and one palette, so the set reads as a single book rather than a gallery.

- One plate format: same aspect ratio, same framing, same background treatment, same scale cue on every creature. Specimen plate or field-guide plate, not splash art.
- Rendering idiom (amended 2026-10-27, see `docs/phase2-brainstorm.md` C1 and C2): a Renaissance silverpoint study in the manner of Leonardo's silverpoint and metalpoint sketches. It is a drawn study sheet, not a print, with visible construction lines, hatching and cross-hatching that follow the form, and optional drawing guides. It is sharper and higher-contrast than the faded originals. The first pass is monochrome: one dark drawing tone on a light paper ground, with no colour at all.
- ~~Rendering idiom: engraving or woodcut feel, restrained palette, visible linework.~~ Superseded 2026-10-27 by the line above. The reasons it gave still hold: visible linework reads as reference, hides generative wobble and does not look like a game asset.
- ~~Reference the tradition, do not copy it: lubok prints and Bilibin are the visual ancestors.~~ Superseded 2026-10-27; lubok was rejected as too old-world. The constraint that remains: Baba Yaga must be recognizable without being Bilibin's.
- Style references are public-domain silverpoint studies (Leonardo, Dürer, Holbein), kept under `style/refs/`. They are style references only: no reference image may depict the creature being drawn.
- Style tokens are fixed text appended to every prompt. Lock them during the pilot; changing them mid-batch invalidates the set comparison.
- Generate from the appearance field only. Nothing in the prompt that is not in the verified entry, apart from the style tokens.
- ~~Unseen creatures get a scene plate from the scene field. The empty bathhouse at night is an honest picture and often a better one.~~ Superseded 2026-10-27: unseen creatures get a scene plate from the scene field plus a minimal, indistinct invented presence (for example a shape in the steam), marked interpretive in the image record and the caption. The bake-off showed empty scene plates reading as abstract.
- Shapeshifters (leshy) get the most commonly attested form, with the plate caption noting the shifting. No composite monsters.

Open style decisions to settle with the first plates, not before: whether plates carry a hand-lettered name and region, whether a single spot color is allowed, and whether the background is blank or a minimal setting.

Amended 2026-10-27: lettering is never generated; it is added in post-processing or by the site. Spot colour is off for the first pass (monochrome). The background is a blank paper ground. What is still tested with the first plates is drawing guides on or off, and a plain or a lightly prepared paper ground.

## Deliverables and evaluation

The pilot is done when these exist and the evaluation questions have answers.

- [ ] Ten entry records in JSON conforming to the schema, each with sources and an attestation grade
- [ ] Ten plates, with prompt, model and seed stored per entry
- [ ] A style sheet: the fixed style tokens, plate format spec, palette
- [ ] A scope note draft stating the inclusion rule and the Slavic exclusions
- [ ] A pilot report: what the verify stage removed from each draft, and why

Evaluation questions:

1. How many of the ten appearance fields were clean enough to generate from without rewriting? Target: 8 or more. Fewer means the draft template needs to be stricter before scaling.
2. How many claims did the verify stage remove or downgrade? High counts on the easy entries (domovoi, Baba Yaga) mean the draft agent is padding from memory; that is the failure to catch.
3. Did the attestation grades land where expected? Drekavac on regional, vampir on widely attested with the Stoker line recorded. Anything landing on literary is the system working.
4. Do the ten plates read as one set side by side? Pin them up together before judging any one of them.
5. Does the scene-plate approach for bannik hold up next to the creature plates, or does it break the set?
6. Do the rusalka variants nest cleanly in one record, and does the poludnitsa record carry three names and regions without awkwardness?

If the answers are good, the next step is the remaining Slavic entries with the same pipeline unchanged. If not, fix the template or the style sheet and rerun the same ten before adding any new creatures.
