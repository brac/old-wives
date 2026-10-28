# Phase 4b, batch 2: nine creatures verified, one held

Draft-v2.1 and verify-v2.1, as in batch 1 (`docs/phase4-batch-1.md`). Before verify, the people table gained the terms the batch 2 drafts met, and three Karadžić headword lookups were fixed (commit "phase 4b batch 2 people terms and three Karadžić headword fixes").

## Results

| Creature | Family | Grade | Draft items | Entry items | Draft cost | Draft + verify |
| --- | --- | --- | --- | --- | --- | --- |
| navka | undead | widely-attested | 86 | 86 | $0.43 | $0.84 |
| zlydni | disease-and-fate | widely-attested | 28 | 28 | $0.38 | $0.77 |
| polunochnitsa | disease-and-fate | literary | 11 | 11 | $0.34 | $0.66 |
| tryasavitsy | disease-and-fate | widely-attested | 68 | 68 | $0.41 | $0.84 |
| sirin | other | literary | 12 | 12 | $0.34 | $0.71 |
| vjestica | other | widely-attested | 47 | 47 | $0.44 | $0.85 |
| tugarin | monster | regional | 27 | 24 | $0.38 | $0.77 |
| usud | disease-and-fate | literary | 17 | 17 | $0.38 | $0.72 |
| ludki | other | literary | 41 | 41 | $0.35 | $0.68 |
| zduhac | other | held (see below) | 32 | not written | $0.40 | $0.78 |

Costs are total subagent tokens at Opus 5.5's input price, the low bound (see batch 1). Every draft is under the $0.50 cap (0.34 to 0.44).

- **Canary:** one clause planted in tugarin before verify, all drafts uncommitted. Removed on page evidence; the verifier did not call it planted. Blind, as in batch 1. tugarin's other two removals are a name row and its native form whose page names no people.
- **Grades:** 4 widely-attested, 1 regional, 4 literary. The four literary entries each rest on one compiler (Afanasyev for polunochnitsa, sirin and usud; Máchal for ludki).
- **People table:** no item in the nine was removed for a missing form. The batch 1 fix held.
- **Families:** this batch has no household, water or field creature; batch 1 and the pilot cover those. Batch 2 spans five families.

## Held: zduhac

The draft filed its three Karadžić native names under Serbs. The pre-verify table pass mapped the place terms printed on those pages (у Ц. г., у Боци, у Рисну) to the new, contested people value Montenegrins, so the verifier removed all three. That left `names.primary.native` empty, which the schema forbids, and the verifier correctly wrote no entry. Its log is held under `.phase-loop/held/` until Ben rules on Montenegrins (a people value, or Serbs); then one re-draft and one verify finish it. This is the plan's stop condition for a contested people term.

## Questions raised for Ben

- **Montenegrins** (blocks zduhac): a separate people value, or Serbs?
- **Máchal's date:** two verifiers asked whether Máchal (1918) counts as the brief's "19th-century compiler" in the literary definition. They graded as if yes.
- **Close paraphrase without a citation:** zlydni (Ralston p.194 against Afanasyev p.404), tugarin (Ralston pp.172-173) and tryasavitsy depend on Ralston counting as independent where he does not cite Afanasyev. That is the Ralston rule as written; counted the other way, zlydni and tugarin drop to literary.
- **Name rows need a printed people term:** tugarin's verifier required it for name and native rows as for peoples rows. Consistent with the table rule; recorded so it is visible.
