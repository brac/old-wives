# Beasts

A field guide to Slavic folklore creatures. Each entry is a JSON file whose every claim carries a citation tag that resolves to a page of a public-domain source held in a local corpus, so claims can be checked mechanically. The spec of record is `docs/Slavic Pilot Brief.md`; the plan is in `plans/`.

| Script | Command | Purpose |
| --- | --- | --- |
| `typecheck` | `tsc --noEmit` | Type check `src` and `test` |
| `test` | `vitest run` | Run unit tests |
| `check` | `npm run typecheck && npm test` | Typecheck then test |
| `validate` | `tsx src/validate/cli.ts` | Validate entries or verify logs |
| `corpus:fetch` | `tsx src/corpus/fetch.ts` | Download raw source files |
| `corpus:build` | `tsx src/corpus/build.ts` | Build per-page JSONL under `sources/pages/` |
| `corpus:verify` | `tsx src/corpus/verify.ts` | Check corpus hashes against the manifest |
| `cite` | `tsx src/corpus/cite-cli.ts` | Resolve a citation tag to page text |
| `find` | `tsx src/corpus/find-cli.ts` | Search the corpus for a term |
