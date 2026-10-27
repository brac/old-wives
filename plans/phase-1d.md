# Phase 1d: v2 prompts and the ten entries re-run under them

Apply Ben's 2026-10-27 rulings on the Phase 1 report, then re-draft and re-verify all ten
pilot creatures under draft-v2 and verify-v2, so that the final plates in Phase 2 are
built from the final template (brainstorm answer D1 (a)).

Spec of record: `docs/Slavic Pilot Brief.md`. Rulings: `docs/BACKLOG.md`, sections "Ben's
rulings on the Phase 1 report" and "Ben's Phase 2 brainstorm answers". Previous plan:
`plans/phase-1.md`, whose protocol carries over except where this plan changes it.

## Milestones and dependency graph

```
1d-a prompts v2 + schema/validator/stats ──> 1d-b draft x10 ──(per creature)──> verify x10 ──> 1d-c stats + v1/v2 delta ──> tag phase-1d
```

1d-a is one serial milestone, because the prompts, the schema, the validator and the
stats script are coupled: each prompt rule needs a schema shape and a validator rule
behind it. 1d-b repeats the Phase 1 protocol (at most three agents live; a draft is
committed before its verify runs). Phase 1d runs beside Phase 2a, the style bake-off,
which shares no files with it (see `plans/phase-2.md`).

## Settled decisions (do not relitigate; the planner's choices are vetoable by Ben)

- **Grade rule (Ben).** A single folklore collector (Afanasyev, Karadžić) counts as the
  brief's "one 19th-century compiler". verify-v2 section 5 states this explicitly:
  printing collected texts does not make a lone collector into multiple sources. No fifth
  grade is added.
- **Ralston (Ben approved; the reading is the planner's).** Ralston 1872 is dependent on
  Afanasyev for any clause where Ralston cites or quotes Afanasyev on that passage, and
  independent elsewhere. Rejected: dependent wholesale.
- **People mapping: deferred by Ben.** verify-v2 keeps flagging Little-Russia, Lusatia,
  Ruthenians, Kief/Chernigof, South-Russian and Kharkov as in v1. No mapping table.
- **Reconciling appearance (Ben).** The planner's mechanism, vetoable: every appearance
  clause gets an optional `form` id. Clauses without `form` describe every form;
  clauses with the same `form` must form one consistent figure. Where sources conflict
  (vodyanoi: bald against long green hair, a reed cap against a boyar's cap of sedge), the
  draft puts the conflicting clauses in different forms and never merges or chooses
  between them. A new `appearance_forms` array lists `{ id, label }` for each form.
  verify-v2 checks that no form contains two clauses that contradict each other, and may
  move a clause to another form (logged as `reformed`). The plate in Phase 2 takes the
  common clauses plus one form. The form is chosen by support count, with Ben's
  per-creature picks (leshy's own shape, poludnitsa's `poles` variant) taking precedence.
  Rejected: letting the draft pick the "true" description (that is inference), and
  splitting forms into `variants` (variants are by people or region, and these
  conflicts are not).
- **`family` checkable (Ben).** `family` becomes `{ value, cites }`. verify-v2 keeps a
  family the cited pages support, retags it, or sets `value: "unclassified"` with
  `cites: []` and logs it as removed. Rejected: leaving `family` as an editorial label,
  because drekavac's `undead` has no page behind it.
- **Variant moves: not ruled by Ben.** verify-v2 still only flags clauses filed under the
  wrong variant; it does not move them.
- **Draft budget (Ben): about $1 per creature (raised from $0.50 on 2026-10-27).** Cost is measured from the token usage
  that the harness reports for each agent run, priced at the API list price of the
  agent's model (from `.phase-loop/research/fal-models.md`). It is recorded per agent in
  the amendments below and per creature in the 1d-c report. A draft agent that runs out
  of budget with relevant pages still unread stops and writes its case for more in its
  scope note: the pages left, and why they matter. The planner brings that to Ben before
  any top-up run. Rejected: an automatic per-source split, which Ben did not choose.
- **Canaries.** Two fresh blind canaries, planted only in the working tree and recorded
  only in the planner's scratchpad until both verifies finish, so no commit subject or
  plan text can leak them. The two creatures are chosen at dispatch time. Rejected: no
  canaries, which would leave v2's catch rate untested.
- **Versions.** The prompts are frozen at draft-v2 and verify-v2 for all ten. The v1
  output stays in git history (tags `phase-1`, `phase-1c`) for the v1-to-v2 comparison.

## Pinned dependencies

- None new. Phase 0 toolchain only.

## Files

1d-a (one agent):
- `prompts/draft.md` becomes draft-v2: appearance forms (section 5), and `family` with
  cites. The rest is unchanged.
- `prompts/verify.md` becomes verify-v2: form consistency and `reformed`, checking
  `family`, the collector and Ralston grade rules in section 5, and the version string.
- `schema/entry.schema.json`: `appearance_forms`, the optional clause `form`, and
  `family` as `{ value, cites }` with `unclassified`.
- `schema/verify-log.schema.json`: a `reformed` array; `family` entries allowed in
  `removed` and `retagged`.
- `src/validate/validate.ts`: every clause's `form` must name an id in
  `appearance_forms`; no empty form; `unclassified` requires empty cites.
- `src/report/stats.ts`: `family` counted as a checkable item; `reformed` in the
  reconciliation (counted on both sides, like retagged); forms per creature.
- `test/`: cases for each new rule, plus fixtures.

1d-b: `data/drafts/<id>.json`, `data/entries/<id>.json` and `data/verify-log/<id>.json`
x10, all overwritten.

1d-c: `docs/pilot-phase1d-report.md`, giving the v1 and v2 stats side by side, per-creature
cost, the canary results, vodyanoi's forms, the grade changes (zmey-gorynych is expected
to become literary), and the eight-of-ten appearance check re-run.

## Stop conditions

| # | Command | Expected observable | Hard or print |
| --- | --- | --- | --- |
| 1 | `npm run typecheck`; `npm test` | exit 0; all pass | hard |
| 2 | `npm run validate -- data/drafts --stage draft` | `10 valid, 0 invalid` | hard |
| 3 | `npm run validate -- data/entries --stage verified` | `10 valid, 0 invalid`, 0 R-RELATED warnings | hard |
| 4 | `npm run validate -- data/verify-log --log` | `10 valid, 0 invalid` | hard |
| 5 | `npm run stats` | reconciliation ok for all ten | hard |
| 6 | Canary check | both canaries absent from `data/entries/`, present in `removed` | hard |
| 7 | Grep every entry for `appearance_forms` | no form holds a contradicting pair (the reviewer reads vodyanoi and leshy in full) | hard for vodyanoi |
| 8 | Per-creature draft cost | at most $1.00, or Ben approved the overrun in advance | hard |
| 9 | Reviewer spot check: 20 clauses, opened with `cite` | at most 2 misses | hard |
| 10 | `npm run corpus:verify` | all sources ok | hard |
| 11 | `git diff phase-1c -- prompts/` after 1d-a is committed | no change during 1d-b | hard |

## Out of scope

- Plates, style and the `image` field (Phase 2).
- The people-mapping table (deferred by Ben).
- A coverage pass over uncited pages (backlog).
- The Machal relabel and a second drekavac source (backlog).
- Do not commit. The reviewer commits after approval.

## Report format

Write the report using the phase-loop `templates/milestone-report.md`, to the path named
in each brief.

## Post-review amendments

- (none yet)
- 2026-10-27: Seven of the ten v2 drafts hit the agent budget with relevant pages unread (domovoi, vodyanoi, leshy, rusalka, baba-yaga, vampir, zmey-gorynych). Ben ruled: accept the gaps and verify the drafts as they stand. Rejected: a second read-only draft pass per dense creature. The draft agents' reported tokens run from 83k to 118k each; the 1d-c report converts them to API-equivalent cost.
- 2026-10-27: The Ralston per-passage rule is kept as written (Ben). Bannik is graded regional, because Ralston p.123 cites nobody, although it closely tracks Afanasyev p.69. Rejected: widening the rule to cover close paraphrase mid-batch.
- 2026-10-27: Canary A was planted uncommitted in poludnitsa `/variants/2/appearance/2`: "She wears a wreath of cornflowers on her head.", cited machal1918:p.267 (0 hits for wreath, flower, garland or crown on the page; 0 for cornflower in the corpus). Verify removed it on page evidence. The test was semi-blind: the verifier saw the draft marked modified in the harness git status, but did not treat the clause as planted.
- 2026-10-27: 1d-c review. A fresh agent fixed two reviewer findings: it removed vodyanoi's "He can transform himself in many ways." and rusalka's Saratof "Described as hideous.". stats now keys canaries by verifier version. An independent spot check found 20 of 20 clauses supported, and the reviewer re-opened 2 of them. The closing battery is green: 137 tests, 11 sources ok, 10/10/10 valid, and all ten reconcile. Report: `docs/pilot-phase1d-report.md`. Rejected: tagging before the two findings were fixed, because the vodyanoi clause would have reached every plate prompt.
