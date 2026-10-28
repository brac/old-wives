# Phase 4b, batch 3: nine creatures drafted and verified

Draft-v2.1 and verify-v2.1, as in batches 1 and 2. New for this batch: the people terms on every hinted page were added to the table before any draft started (`.phase-loop/reports/4b-peoples-5.md`), so the drafts could map them. No item in batch 3 was lost to a missing table form, and no draft met a Slavic people term the table lacked.

## Results

| Creature | Family | Grade | Draft items | Entry items | Draft cost | Draft + verify |
| --- | --- | --- | --- | --- | --- | --- |
| mora | other | widely-attested | 80 | 80 | $0.44 | $0.87 |
| stuhac | unclassified | literary | 10 | 10 | $0.35 | $0.66 |
| morovaya-deva | disease-and-fate | widely-attested | 32 | 31 | $0.42 | $0.78 |
| ala | monster | literary | 11 | 11 | $0.40 | $0.76 |
| firebird | other | widely-attested | 51 | 50 | $0.39 | $0.80 |
| indrik | monster | literary | 31 | 31 | $0.44 | $0.81 |
| kresnik | household | literary | 10 | 10 | $0.32 | $0.62 |
| moroz | other | regional | 50 | 46 | $0.41 | $0.84 |
| solovei-razboinik | monster | widely-attested | 32 | 32 | $0.40 | $0.78 |

Costs are plan tokens priced at Opus 5.5's input rate, the low bound (see the 2026-10-28 cost decision in `docs/BACKLOG.md`). Every draft is under the $0.50 cap (0.32 to 0.44).

- **Canary:** one clause planted in firebird before verify, all drafts uncommitted. Removed on page evidence; the verifier did not call it planted. Three batches, three blind catches.
- **Grades:** 4 widely-attested, 1 regional, 4 literary. The literary four rest on one compiler each (Karadžić for stuhac and ala, Afanasyev for indrik, Máchal for kresnik).
- **Removals:** moroz lost four name rows (Морозко, Морозъ-Трескунъ, Studenets and its native form) because their pages print "peasants" and no people term; morovaya-deva lost a clause that was behaviour filed as appearance; firebird's removal is the canary.

## Fixed during the batch

The site tests timed out once batch 3 was on disk: loading the 38 entries took about 7 seconds, almost all of it in Karadžić `s.v.` lookups without a headword override (stuhac alone took 4.6 s), because the resolver normalised every line of the dictionary on every lookup. The resolver now caches the normalised lines per source and memoises each tag. Every one of the 404 cite tags in `data/` resolves to the same leaves and text as before (hashed against the previous resolver); loading now takes under a second.

## Questions raised for Ben

- **Montenegrins:** mora records Montenegrins (from the contested row) alongside four other peoples; zduhac is still held on the same question.
- **Máchal's date:** raised again by the kresnik verifier.
- **Ralston independence:** firebird, morovaya-deva, moroz and solovei-razboinik each count Ralston as a second source where he does not cite Afanasyev on that passage; firebird's p.285 closely parallels Afanasyev.
- **A people term on a nearby page:** solovei-razboinik's verifier kept native rows whose people rests on a term printed on a neighbouring page, and flagged them.
- **Asymmetric link:** oboroten links to kresnik, but kresnik's draft did not link back, and a verifier cannot add a link.
