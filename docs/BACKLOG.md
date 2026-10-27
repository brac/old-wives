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
