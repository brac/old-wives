# Phase 4b, batch 1: ten creatures drafted and verified

Draft-v2.1 and verify-v2.1, run as in Phase 1d, one fresh agent per draft and one per verify. Plan: `plans/phase-4.md`, 4b. Candidates and batch choice: `docs/phase4-candidates.md`.

## Results

| Creature | Family | Grade | Draft items | Entry items | Draft cost | Draft + verify |
| --- | --- | --- | --- | --- | --- | --- |
| kikimora | household | regional | 52 | 52 | $0.40 | $0.81 |
| vila | water | widely-attested | 94 | 94 | $0.44 | $0.86 |
| polevik | field | widely-attested | 22 | 21 | $0.36 | $0.72 |
| likho | disease-and-fate | widely-attested | 58 | 57 | $0.47 | $0.87 |
| koschei | monster | widely-attested | 41 | 40 | $0.40 | $0.78 |
| alkonost | other | literary | 8 | 8 | $0.35 | $0.69 |
| oboroten | monster | widely-attested | 73 | 73 | $0.45 | $0.93 |
| skritek | household | literary | 52 | 52 | $0.37 | $0.73 |
| divozenka | forest | widely-attested | 109 | 109 | $0.42 | $0.88 |
| dolya | disease-and-fate | widely-attested | 53 | 53 | $0.44 | $0.86 |

Item counts are after the restore round. polevik's removed item is the planted canary. Costs are total subagent tokens at Opus 5.5's input price ($4 per million), the low bound; at the output price the figures are five times higher, and the true cost lies between, input-dominated (`data/cost.json`, `npm run cost -- show`).

- **Cap:** every draft is under the $0.50 draft cap (0.35 to 0.47). likho came closest; agents overrun their nominal 100k-token budget by up to 20%, so the cap has about 5% headroom at the top.
- **Canary:** one clause planted in one draft before verify, with every batch 1 draft uncommitted and the verifiers barred from git. It was removed on page evidence and the verifier did not call it planted: the first fully blind result (Phase 1d's were semi-blind).
- **Grades:** 7 widely-attested, 1 regional, 2 literary. alkonost and skritek rest on one compiler each (Afanasyev, Máchal).
- **Totals (20 verified, `npm run stats`):** removed 5 excluding canaries, downgraded 28, retagged 9, flagged 37; reconciliation ok.

## What went wrong, and the fix

The verifiers matched people terms against `sources/peoples.json` exactly, as verify-v2.1 says, and the table lacked forms the sources print ("Russia", "Czechs", the adjective "Bulgarian", "Lusatian"). Sound content was removed for that alone, worst in divozenka, which lost its whole Bulgarian variant. Three table passes followed: terms the drafts met, terms the later drafts met, then every form the corpus prints for each uncontested row (237 forms). A restore round re-verified only the items lost to table gaps: divozenka (Bulgarian variant and people row), kikimora (mora variant, мара, the Russians cite), vila (Czechs, Karadžić on Serbs) and oboroten (a Russians cite) are restored, each logged.

**Known gap, accepted:** terms the draft agents correctly left unmapped (for example likho's Cyrillic Лихо and its Russians row, dolya's Ukrainians, vila's Croatians) were never draft items, so a verifier cannot add them. Adding them needs a second draft pass, which Ben's Phase 1d ruling rules out (no top-ups, no second reading passes). They are listed in the restore reports under `.phase-loop/reports/4b-restore-*.md` and can be picked up if the batch is ever re-run. Batches 2 and 3 start with the complete table.

## Questions raised for Ben

- Footnotes: alkonost cites an Afanasyev footnote that discusses the bird; the verifier accepted it as the author's prose. The Phase 1d ruling treats footnotes as references.
- skritek's native form "Skřítek" restores diacritics the OCR garbles; flagged, not removed.
- dolya and polevik: Máchal closely follows Afanasyev on these passages without citing him. Counted independent under the Ralston rule as written.
- Shared pages: kikimora and mora share Máchal p.228; mora is drafted in batch 3 as a separate creature.
