# Slavic pilot: final report

Written 2026-10-27 at the close of Phase 3. It answers the six evaluation questions in
`docs/Slavic Pilot Brief.md` finally (the brief lists six, as the Phase 3 plan says). The
detail behind each answer is in `docs/pilot-phase1-report.md` (v1 prompts),
`docs/pilot-phase1d-report.md` (v2 prompts, the shipped entries) and `plans/phase-2.md`
(plates). Counts of the shipped data come from `data/entries/*.json`.

## The six questions

| # | Question | Answer |
| --- | --- | --- |
| 1 | Appearance fields clean enough to generate from (target 8+) | **9 of 10** under v2, up from 8 of 10 under v1 (Ben confirmed the v1 count). Only drekavac is not clean: its one clause, "a four-footed animal", leaves any plate invented. Vodyanoi became clean once appearance forms kept its competing descriptions apart. The target is met on the data, but the final plates were not drawn from these fields: Ben moved every plate to his visual-tradition text, and all ten carry `image.interpretive: true`. |
| 2 | Claims verify removed or downgraded; padding on the easy entries | v2: **3 removed of 818** drafted items outside the canaries, 19 downgraded, 4 retagged, 30 flagged. v1: 2 removed of 825, 17 downgraded. Every removal was a true clause in the wrong field or a style word, not a fabrication. Easy entries in v2: domovoi 0 removed and 4 downgraded, baba-yaga 0 and 0. No sign of padding from memory. All 5 planted canaries were caught on page evidence, but only 1 of the 5 tests was fully blind. Verify checks only the pages a draft cites, so low counts show that what was cited holds, not that nothing was missed. |
| 3 | Did the grades land where expected | Final grades: **7 widely-attested, 2 regional (bannik, zmey-gorynych), 1 literary (drekavac)**. Vampir is widely-attested with the Stoker exclusion recorded in its notes, as expected. Drekavac was expected on regional and landed on literary: one Karadžić article, repeated in 1818 and 1852, is one compiler under the collector rule. That is the system working, as the brief says. Bannik moved from literary (v1) to regional (v2) because of the per-passage Ralston rule, and the collector rule and the Ralston rule pull against each other (question for the batch, below). Ben settled both rules as they stand for the pilot. |
| 4 | Do the ten plates read as one set side by side | **Approved one by one, not yet judged as a pinned-up set.** Ben approved all ten over five review rounds, at $5.209 of the $25 cap. Round three drifted into colour, measured as tinted samples (bannik about 63% against 1.7% for the approved baba-yaga), and was pulled back by restating the style sentence at the head of every prompt. The ten-up views now exist: `docs/contact-sheet.webp` and the contents page screenshot `docs/phase3-screens/contents-1280.png`. Whether they read as one book, and whether Baba Yaga and Zmey Gorynych avoid stock fantasy (Zmey is now a three-headed, four-legged winged dragon at Ben's direction), is Ben's call on those views. |
| 5 | Does the bannik scene plate hold up next to the creature plates | **No.** Every bannik scene plate read too abstract. The brief's unseen rule was amended to allow a minimal invented presence, and then the visual-tradition ruling made bannik a figure: a small, wild old man with a bath whisk and a bucket, and no bathhouse. The set has no scene plates. The data rule survived: bannik's entry keeps an empty appearance field and 2 scene clauses, and every spread states that its plate is a drawing after the folk tradition. |
| 6 | Rusalka variants in one record; poludnitsa names and regions | **Yes for both, with one strain.** Rusalka is one record: 16 appearance clauses with 2 forms, plus 2 regional variants (`saratof`, `astrakhan-marine`). Poludnitsa carries 7 name variants, 13 peoples-regions rows over 4 peoples (Czechs, Poles, Sorbs, Russians) and 6 variants, without awkwardness. The strain: forms exist only at the top level, so the `bohemian` and `lusatian` variants each still mix more than one figure. Ben ruled no forms inside variants for the first pass. |

## Deliverables

| Deliverable (brief) | Status | Path |
| --- | --- | --- |
| Ten entry records in JSON conforming to the schema, each with sources and an attestation grade | done | `data/entries/*.json`, schema `schema/entry.schema.json` |
| Ten plates, with prompt, model and seed stored per entry | done | `plates/slavic/*.web.webp` and `*.thumb.webp`; `image.prompt`, `image.model`, `image.seed` in each entry |
| A style sheet: the fixed style tokens, plate format spec, palette | done | `style/STYLE-SHEET.md` |
| A scope note draft stating the inclusion rule and the Slavic exclusions | done (draft, Ben edits) | `site/src/content/about.md`, served at `/about/` |
| A pilot report: what the verify stage removed from each draft, and why | done | per entry in `docs/pilot-phase1-report.md` (v1) and `docs/pilot-phase1d-report.md` (v2); the item-level record is `data/verify-log/*.json`; this file closes the questions |

Two pipeline stages did not run as the brief wrote them. Stage 3 builds the prompt from
Ben's visual-tradition text, not mechanically from the appearance field. Stage 4, the
automated vision check, was replaced by Ben's review of every plate.

## What changes before the full Slavic batch

The brief says to scale with the pipeline unchanged if the answers are good. The answers
are good enough to scale, but four things change first. **A coverage pass:** seven of the
ten v2 drafts stopped at their roughly 100k-token budget with relevant pages unread,
mostly Afanasyev, and verify cannot see an omission on a page nobody cited, so a pass that
samples uncited pages for name variants has to run before the counts in question 2 mean
"complete" rather than "supported". **A people-mapping table:** Little-Russia, Lusatia,
Ruthenians, Kief/Chernigof, South-Russian and Kharkov are mapped entry by entry, and
leshy's grade rests on one of those mappings, so the table has to exist before 100 to 150
entries each guess. **Draft cost measurement:** the ten v2 drafts used 1,044,268 tokens
(83k to 118k each), and Ben ruled that cost is measured in tokens against the per-agent
budget, so the batch needs that count logged per creature from the start rather than
reconstructed after. **The grade rule:** under the collector rule alone bannik and
zmey-gorynych would be literary, and the per-passage Ralston rule keeps them regional, so
the rule should be revisited once the batch's grade distribution is visible, as Ben asked.
The plate pipeline also needs one decision: whether batch plates keep coming from Ben's
visual-tradition text, which makes him the bottleneck on every creature.
