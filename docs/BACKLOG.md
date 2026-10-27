# Beasts backlog and decision log

The spec of record is `docs/Slavic Pilot Brief.md`. This file holds the phase map
and the project-scoped "why" behind decisions, each with the rejected alternative.

## Phase map

| Phase | Delivers | Needs Ben |
| --- | --- | --- |
| 0 | Foundation: repo scaffold, entry JSON Schema and validator, PD source corpus with manifest and citation resolver, draft and verify role prompts | No |
| 1 | Stages 1 and 2 for all ten pilot creatures: drafted, independently verified, graded entries plus per-entry verify diffs | No |
| 2 | Style sheet, image generation (stage 3) and vision check (stage 4) | Yes: style and image-model brainstorm first |
| 3 | Human review (stage 5), scope note draft, pilot report answering the six evaluation questions | Yes |

## Decisions

- 2026-10-26: Overnight run covers Phase 0 and Phase 1; nothing visual or billable.
  Rejected: stopping after Phase 0, which would leave the night's second half idle
  when Phase 1 needs no human judgement.
- 2026-10-26: TypeScript on Node (ajv for JSON Schema, vitest). Rejected: Python,
  whose text tooling is stronger but which does not match the likely static-site
  front end.
- 2026-10-26: Draft and verify agents run as Claude Code subagents driven by
  versioned prompt files in the repo, with no API spend. Rejected: scripted Claude API
  calls from day one; revisit when scaling past the pilot to 100+ creatures.
- 2026-10-26: Branch renamed `master` to `main`; private GitHub repo `brac/beasts`;
  repo-local git author `brac`. Rejected: local-only repo.
- 2026-10-26: Image model and provider, style tokens, plate format and the three open
  style decisions (lettering, spot color, background) are deferred to a brainstorm
  with Ben before Phase 2. Rejected: picking a provider overnight, because it is a
  billing lever and Ben is the visual judge.
- 2026-10-26: Phase 0 settled decisions (corpus layer, tag grammar, source ids, the two
  added sources Calmet 1850 and Erben 1893, two-stage validation, verify log) are
  recorded with their rejected alternatives in `plans/phase-0.md`.

## Open items

- Drekavac has one PD author (Karadžić 1818/1852, a one-line gloss). Candidate second
  sources: Milićević, *Život Srba seljaka* (1894) and *Glasnik Zemaljskog muzeja*
  (1889 on). The IA Google scans have no usable Cyrillic text layer; a better scan is
  needed (digitalna.nb.rs, BSB). The pilot proceeds with the thin source and lets the
  verify stage grade it.
- Machal 1918's English translator: confirm the name and death year before quoting at
  length for an EU audience. US public-domain status is clear.
- Code license for the repo (the dataset is CC BY 4.0 per the brief): decide by Phase 3.
- 2026-10-26: Phase 0 closed (tag `phase-0`). The validator now rejects unresolvable
  citations, page tags on the column-numbered dictionaries, and source rows that
  disagree with the manifest. The draft and verify role prompts are frozen at
  `draft-v1` / `verify-v1` for the whole pilot batch, for the same reason the brief locks
  the style tokens: changing them mid-batch invalidates the set comparison.
- Open for Ben: does Karadžić's dictionary (one collector, two editions) count as
  "multiple sources" for the `regional` grade? The verify prompt counts sources by
  author, so drekavac will likely land on `literary` rather than the `regional` the
  brief expects.
- Machal 1918 page labels: IA counts blank plate leaves as pages, so printed pp. 87-107
  carry labels 91-115 and labels 108-115 repeat. Switch `machal1918` to
  `page_label_source: "header"` (built in the Phase 1 corpus fix) and check the plate
  leaves before any batch cites that range. No pilot citation is affected.
- 2026-10-27: Phase 1 closed (tag `phase-1`). All ten pilot creatures are drafted and
  independently verified; results and the six open decisions for Ben are in
  `docs/pilot-phase1-report.md`. The headline decision is the grade rule: whether a
  single folklore collector (Afanasyev, Karadžić) counts as the brief's "one
  19th-century compiler". Verifiers ruled both ways on the same pattern.
