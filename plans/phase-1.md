# Phase 1: draft and verify the ten pilot entries

Run pipeline stages 1 (draft) and 2 (verify) for all ten creatures, with no art. This
produces the verify-stage removal counts, the attestation grades and the appearance
fields as a set, which answer evaluation questions 2, 3 and 6 and give a provisional
answer to question 1 before any plate is generated.

Spec of record: `docs/Slavic Pilot Brief.md`. Prompts: `prompts/draft.md` (draft-v1),
`prompts/verify.md` (verify-v1), `prompts/creatures.json`. Foundation: `plans/phase-0.md`.

## Milestones and dependency graph

```
1a draft x10 ──(per creature)──> 1b verify x10 ──> 1c pilot stats + phase-1 report ──> tag phase-1
```

Each creature is an independent pair (draft, then verify) with a disjoint file set
(`data/drafts/<id>.json`; `data/entries/<id>.json` plus `data/verify-log/<id>.json`). The
corpus is read-only. No worktrees are needed, because no agent edits shared code. At most
three agents are live at once, because of the machine and the planner's review load.

## Research-verified facts and settled decisions (do not relitigate)

- One fresh agent per draft and one fresh agent per verify. Opus 5.5 for both, because
  translation of Russian, Serbian, German and Czech pages and judgement of support need
  the strongest implementer. Rejected: Sonnet for drafts, where the brief's failure to
  catch is a draft padding from memory, and a weaker model pads more.
- A verify agent is dispatched only after its draft is validated and committed. It is
  told the draft path and nothing about the draft agent's run. Rejected: one agent doing
  both, which breaks "no stage grades its own work".
- **Canaries.** Before verify, the planner plants exactly one fabricated clause in two
  drafts: domovoi and baba-yaga, the easy entries where padding matters most. Each
  canary carries a real, resolvable tag whose page does not say the claim. The canary
  text and tag are recorded in this plan's amendments when planted. A verify agent that
  keeps a canary has failed the milestone. Canary removals are subtracted from the
  reported removal counts for evaluation question 2. Rejected: no canaries, which leaves
  a verify stage that removes nothing indistinguishable from a careless one.
- Drafts are committed as drafted, before verify runs, so the before-and-after diff is in
  git history.
- Prompts are frozen at draft-v1 and verify-v1 for all ten. A prompt defect found
  mid-batch is recorded in amendments and fixed only by rerunning every affected
  creature on the new version. Rejected: editing prompts between creatures, which
  invalidates the set comparison, the same logic as the brief's style-token lock.

## Pinned dependencies (nothing else)

- No new packages. Phase 0 toolchain only.

## Files to create or modify

- `data/drafts/<id>.json` x10, written by the 1a agents.
- `data/entries/<id>.json` x10 and `data/verify-log/<id>.json` x10, written by the 1b agents.
- `src/report/stats.ts` plus an npm script, staged in 1c. It prints per creature: draft
  clause count per field, verified clause count per field, removed, downgraded, retagged
  and flagged counts, grade, and whether appearance is empty (scene used). It also runs a
  **reconciliation check**: draft clauses = verified clauses + removed, per field, with
  downgraded and retagged counted on both sides. Exit 1 on mismatch.
  - `package.json` gains one script, `stats`. This is the only package.json edit in the phase.
- `docs/pilot-phase1-report.md`, written in 1c:
  - the stats table;
  - what verify removed from each draft and why (the brief's deliverable 5, partial);
  - grade landing versus expectation (drekavac on regional, vampir on widely attested
    with the Stoker line recorded, anything on literary called out);
  - how the rusalka variants and the poludnitsa names nested;
  - the ten appearance fields side by side with a provisional per-entry "clean enough
    to generate from" judgement and its reason. This judgement is provisional: Ben makes
    the final call on question 1.

## Stop conditions

| # | Command | Expected observable | Hard or print |
| --- | --- | --- | --- |
| 1 | `npm run typecheck`; `npm test` | exit 0; all pass | hard |
| 2 | `npm run validate -- data/drafts --stage draft` | `10 valid, 0 invalid` | hard |
| 3 | `npm run validate -- data/entries --stage verified` | `10 valid, 0 invalid`, R-RELATED warnings 0 | hard |
| 4 | `npm run validate -- data/verify-log --log` | `10 valid, 0 invalid` | hard |
| 5 | `npm run stats` | reconciliation ok for all ten; table printed | hard (reconcile), print (counts) |
| 6 | Canary check: grep both canary texts in `data/entries/` | absent, and present in the matching verify-log `removed` | hard |
| 7 | Reviewer spot check: two random clauses per entry, tag opened with `cite` | the page supports the clause; misses recorded | print; more than 2 misses in 20 is a stop |
| 8 | `npm run corpus:verify` | `11 sources ok` | hard |
| 9 | `git diff --stat phase-0 -- sources/ prompts/` | empty (corpus and prompts frozen) | hard |

## Out of scope

- Images, style tokens, the vision check (Phase 2, blocked on Ben).
- Editing the corpus, the schema or the prompts mid-batch.
- Creatures beyond the ten.
- Finding a second drekavac source (it is in the backlog).
- Do not commit. The reviewer commits after approval.

## Report format

Write the report using the phase-loop `templates/milestone-report.md`, to the path named in each brief.

## Post-review amendments

- (none yet)
- 2026-10-26: Canary 1 planted in `data/drafts/domovoi.json` at `/appearance/2`: "He wears a tall felt hat.", cited `machal1918:p.240`. The page has no "hat" or "felt", and corpus-wide `find "felt hat"` returns 0 hits. Committed separately from the draft.
- 2026-10-26: Finding: the draft agents for domovoi and rusalka hit the 100k budget before reading every hit page (Afanasyev vols. 2 and 3 mostly unread). Each recorded the gap in a scope note. Accepted for the pilot, and the protocol stays frozen. This is a scaling finding for the pilot report: the dense creatures need either a per-source split of the draft stage or a larger budget. Rejected: sending a second draft agent to fill gaps, because it changes the protocol for some creatures and not others and so breaks the set comparison.
- 2026-10-26: Canary 1 (domovoi) was removed by verify for the right evidentiary reason, but the test was **not blind**. The verify agent's report calls it "the planted canary". The likely leak is the recent-commits list the harness gives subagents, which showed the commit "test: plant verify canary in the domovoi draft". The result counts as caught-but-contaminated. Remedy: the remaining canaries (baba-yaga, plus a replacement in vodyanoi) are planted in the working tree only, uncommitted while verify runs, and recorded in the planner's scratchpad. They are committed together with the verify output afterwards, under an honest message. Rejected: a misleading neutral commit message, because git history must stay truthful.
- 2026-10-27: Canary 2 was planted in `data/drafts/vodyanoi.json` at `/behavior_habitat/17`: "He flees at the sound of church bells.", cited `ralston1872:p.151` (0 "bell" on that page). It was planted uncommitted, in the working tree only. Verify removed it on page evidence (p.151 is silent; the bells on p.150 belong to the drowned girl's story) and logged it in `removed`. It was semi-blind: the verifier knew canaries might exist, from the earlier commit subject, but not where. Committed with the verify output.
- 2026-10-27: Corpus defect found. The `afanasyev1865` page labels from IA's `_page_numbers.json` are 2 lower than the printed running header on 750 of 762 leaves. A header-versus-label audit of all sources found every other paged source at 98% agreement or better; Karadžić 1852 is off, but it is headword-cited only. Fix round `phase-1-corpusfix`: header-derived labels for that volume, an audit test, and a mechanical relabel of the three poludnitsa draft tags (same text, corrected page number). Rejected: leaving it with a note, because every citation to vol. 1 would name the wrong printed page.
- 2026-10-27: R-RELATED does not fire in single-file validation, by design (plan: "when a directory is validated"). Verify agents expected it. Directory validation at the 1c gate is the check of record.
- 2026-10-27: Corpus fix accepted. A leaf with no header number takes the offset its nearest neighbours share; the brief's flat +2 would have duplicated p.11. The new audit test found a second defect: IA counted blank plate leaves in `machal1918`, so printed pp. 87-107 carry labels 91-115, with 108-115 duplicated. No pilot tag cites that range (all Machal tags are pp. 240-271), so it is recorded as a known defect with a 90% floor and written reason, and logged in the backlog for a header-relabel of Machal before scaling. Rejected: fixing Machal mid-batch, because no pilot citation depends on it. Draft notes that mention the old vol. 1 page numbers (poludnitsa, leshy) were left as drafted.
- 2026-10-27: Canary 3 was planted in `data/drafts/baba-yaga.json` at `/appearance/4`: "She has a single eye in the middle of her forehead.", cited `ralston1872:p.162`. Neither p.161 nor p.162 has "eye" or "forehead"; the one-eyed "cyclops" on p.154 is the leshy, so this also tests cross-creature contamination. It was planted uncommitted, and the verifier's report shows no awareness of canaries. Verify removed it: pp.161-164 are silent, and the one-eyed hits do not name her. This is the cleanest blind test of the three.
