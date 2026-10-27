# Phase 0: foundation

Build what stages 1 and 2 of the pilot need before any entry is written: a scaffold, an
entry schema whose validator makes an untagged claim impossible, and a local
public-domain corpus whose citation tags resolve to real pages. Draft and verify agents in
Phase 1 read only this corpus, so every claim they make can be checked mechanically.

Spec of record: `docs/Slavic Pilot Brief.md`. Research: `.phase-loop/reports/phase-0-research-sources.md`
and `.phase-loop/reports/phase-0-research-toolchain.md` (gitignored; findings restated below).

## Milestones and dependency graph

```
0a scaffold ──┬── 0b schema + validator (lane A, worktree) ──┬── 0d seam: cite resolution in validator, role prompts, phase tag
              └── 0c corpus + resolver   (lane B, worktree) ──┘
```

0b and 0c have disjoint file sets once 0a has pre-staged `package.json` scripts, so they run
as two lanes. 0d needs both and runs serial on the merged tree.

## Research-verified facts and settled decisions (do not relitigate)

Facts:

- Every IA source has `_djvu.xml` (one `<OBJECT>` per leaf) and `_page_numbers.json`
  (`leafNum -> pageNumber`). `_djvu.txt` has no page breaks, so it cannot anchor pages.
- Draft 2020-12 needs `import Ajv2020 from "ajv/dist/2020.js"` and `new Ajv2020.default(...)`;
  `addFormats.default(ajv)`. Without `.default`, tsc fails under NodeNext while tsx runs
  fine, so `tsc --noEmit` is a hard gate. Relative imports end in `.js`.
- npm 12 blocks install scripts by default; tsx and vitest still work. `npm view ... time --json` returns a one-element array.
- Karadžić 1818 is numbered by column and IA cannot recover columns (page_numbers confidence 16).
- Karadžić 1852 OCR mangles the German and Latin glosses; 1818 is readable in all three scripts.
- Afanasyev OCR is pre-reform orthography (ѣ, і, ъ); title pages read 1865, 1868, 1869 though IA metadata says 1865 for all.
- Machal OCR keeps diacritics inconsistently ("LéSiy", "Lésiy").
- Frombald 1725 is not fetchable from ANNO (Cloudflare Turnstile); German Wikisource has a finished transcription with `{{Seite|11}}`, `{{Seite|12}}` markers.
- Machal is a spine only for domovoi, rusalka, leshy, vodyanoi, poludnica and vampire. Drekavac has one PD author (Karadžić, two editions).

Decisions (vetoable by Ben, each with its rejected alternative):

- **Canonical text layer is `_djvu.xml` mapped through `_page_numbers.json`.** Rejected: hOCR, about twice the size, whose word boxes only help highlighting, which nothing needs yet.
- **Raw downloads are gitignored under `sources/raw/`; the derived per-page JSONL under `sources/pages/` is committed** (about 25 MB), with sha256 for every raw and derived file in the manifest. Rejected: committing raw XML (about 190 MB of git bloat); committing nothing (citations would not be auditable on GitHub, and Phase 1 agents would depend on network fetches).
- **Source ids are one per volume:** `machal1918`, `ralston1872`, `ralston1873`, `afanasyev1865` (vol. 1), `afanasyev1868` (vol. 2), `afanasyev1869` (vol. 3), `karadzic1818`, `karadzic1852`, `frombald1725`, `calmet1850v2`, `erben1893`. Rejected: one id per work with a volume field, which would put a third component into every tag.
- **Two sources added beyond the brief's table:** Calmet, *The Phantom World* vol. 2 (1850, PD English paraphrase of the Plogojowitz report) and Erben, *Kytice* (1893 edition, PD; a literary poem). Erben is marked `kind: "literary"` in the manifest so the verify agent can grade on it honestly. Rejected: leaving them out, which leaves the vampir entry with no PD English for its key case and the poludnitsa entry without its known literary source.
- **Citation tag grammar:** `<sourceId>:p.<page>`, `<sourceId>:pp.<first>-<last>`, or `<sourceId>:s.v.<headword>` (dictionaries only). Pages are strings, so roman front matter works (`ralston1872:p.xiii`). Rejected: leaf numbers as the primary anchor, which nobody can check against a printed copy.
- **Dictionary headwords resolve by normalised exact match first, then a curated override table** `sources/headwords/<sourceId>.json` (`headword -> leaf`, with the OCR spelling seen), because the OCR misreads pilot headwords (Дрекавац comes out as "Древавац"). Rejected: fuzzy matching, which would silently resolve wrong headwords.
- **One normalisation function, used for every match:** NFC, then lowercase; strip combining marks (NFD then remove `\p{M}`, then NFC); map ѣ→е, і→и, ѳ→ф, ѵ→и, ё→е, й→и; drop ъ at word end; collapse whitespace. So `леший` matches `лѣшій` and `lesiy` matches `LéSiy`. Rejected: separate per-script normalisers.
- **Validation has two stages:** `--stage draft` requires `attestation` to be `null`; `--stage verified` requires a full attestation. Draft agents never grade.
- **The verify log is a schema'd JSON record** (`data/verify-log/<id>.json`) listing every removed, downgraded or re-tagged clause with its reason. This file is what answers evaluation question 2. Rejected: free-text verify notes, which cannot be counted.
- **Lane A checks citation grammar and that each cite's source id appears in the entry's `sources`.** The check that the page exists in the corpus is added in 0d, so the lanes do not depend on each other.

## Entry schema (load-bearing; 0b implements exactly this)

`schema/entry.schema.json`, draft 2020-12, `unevaluatedProperties: false` everywhere.

```
Clause      = { text: string (min 1), cites: CiteTag[] (minItems 1) }
CiteTag     = string matching ^[a-z0-9]+:(p\.[0-9ivxlcdm]+|pp\.[0-9ivxlcdm]+-[0-9ivxlcdm]+|s\.v\..+)$
Entry = {
  id: kebab-case string, equal to the file basename
  schema_version: 1
  names: {
    primary: { romanized: string, native: [{ script: "Cyrl"|"Latn"|..., text, people }] (minItems 1) },
    variants: [{ romanized, native?: [...], peoples: string[] (minItems 1), cites: CiteTag[] (minItems 1) }],
    meaning: Clause[]
  }
  peoples_regions: [{ people: string (not Slavic/Slav/Slavs/Slavonic, case-insensitive), region?: string, cites: CiteTag[] (minItems 1) }] (minItems 1)
  family: "household"|"water"|"forest"|"field"|"undead"|"disease-and-fate"|"monster"|"other"
  appearance: Clause[]          // may be empty
  scene: Clause[]               // required with minItems 1 when appearance is empty (if/then)
  variants: [{ id, label, peoples: string[] (minItems 1), appearance: Clause[], behavior_habitat: Clause[], notes?: string }]
  behavior_habitat: Clause[]
  dealing_with_it: Clause[]
  origin: Clause[]
  related: [{ id: kebab-case, relation: "often-confused"|"related"|"class-of"|"instance-of" }]
  attestation: null | { grade: "widely-attested"|"regional"|"literary"|"disputed", rationale: Clause[] (minItems 1), assigned_by: "verify" }
  sources: [{ source_id, author, title, year: integer, url, public_domain: boolean }] (minItems 1)
  image: null | { file, prompt, model, seed, date, style_tokens_version }
  notes: [{ kind: "accretion"|"disputed"|"scope"|"empty-field"|"other", text, cites?: CiteTag[] }]
}
```

Semantic rules enforced in code, beyond the schema:

- R-PD: at least one `sources` row has `public_domain: true`.
- R-CITE-SRC: every cite's source id appears in that entry's `sources`.
- R-ID: `id` equals the file basename.
- R-RELATED: when a directory is validated, every `related[].id` exists in it. This is a warning in draft and an error in verified.
- R-STAGE: draft requires `attestation === null`; verified requires it non-null.

`schema/verify-log.schema.json`:
`{ entry_id, verifier_prompt_version, removed: [{ field, text, cites, reason }], downgraded: [{ field, text, from_cites, to_cites, reason }], retagged: [...same shape...], flagged: [{ field, text, reason }], grade, grade_rationale }`.

## Pinned dependencies (nothing else)

- typescript@7.0.2
- ajv@8.20.0
- ajv-formats@3.0.1
- vitest@5.0.4
- tsx@4.23.15
- @types/node@24.19.2
- Node built-ins only for HTTP (`fetch`), hashing, XML handling and file I/O. No XML library: djvu.xml `<OBJECT>` and `<WORD>` extraction uses a small streaming scanner, so no dependency is added. If that proves unworkable, stop and report; do not add a package.

## Files to create or modify

### 0a scaffold (serial, on main)

- `package.json`: `"type": "module"`, `"private": true`, `"license": "CC-BY-4.0"` for data (code license is a Phase 3 question; leave `UNLICENSED` plus a note in the backlog if needed), exact pinned devDependencies, and these scripts, pre-staged so the lanes never touch this file:
  - `typecheck`: `tsc --noEmit`
  - `test`: `vitest run`
  - `check`: `npm run typecheck && npm test`
  - `validate`: `tsx src/validate/cli.ts`
  - `corpus:fetch`: `tsx src/corpus/fetch.ts`
  - `corpus:build`: `tsx src/corpus/build.ts`
  - `corpus:verify`: `tsx src/corpus/verify.ts`
  - `cite`: `tsx src/corpus/cite-cli.ts`
  - `find`: `tsx src/corpus/find-cli.ts`
- `tsconfig.json`: `module`/`moduleResolution` `NodeNext`, `strict`, `noEmit`, `target` ES2023, include `src`, `test`.
- `.gitignore`: add `sources/raw/`.
- `test/smoke.test.ts`: one passing test, so `npm test` is green at baseline.
- `src/`, `schema/`, `sources/`, `data/entries/`, `data/verify-log/`, `prompts/`, `fixtures/`: created with a `.gitkeep` where empty.
- `README.md`: one paragraph on what the repo is, plus the npm scripts table.

### 0b schema and validator (lane A)

- `schema/entry.schema.json` and `schema/verify-log.schema.json`, as specified above.
- `src/validate/validate.ts`: `validateEntry(obj, { stage, basename }) -> Issue[]` and `validateDir(dir, { stage }) -> Report`. Issues carry `{ rule, path, message, severity }`, where `rule` is a schema keyword or an R-* id.
- `src/validate/cli.ts`: `npm run validate -- <dir|file> --stage draft|verified [--log]` (`--log` validates verify-log files). Prints one line per issue, then a summary line `N valid, M invalid, W warnings`. Exit 1 if any file is invalid.
- `fixtures/valid/draft/` (attestation null) and `fixtures/valid/verified/` (attestation set): between them at least three entries: a seen creature, an unseen one (empty appearance, filled scene) and one with nested variants. Plus `fixtures/valid/log/` with one valid verify-log. Fixture content may be placeholder text, but cite tags must use real source ids and grammatical tags.
- `fixtures/invalid/<rule>.json`: one file per rule to prove each failure. Minimum set: untagged clause (`cites: []`), clause missing `cites`, bad tag grammar, `people: "Slavic"`, empty appearance with no scene, unknown property, bad family, no PD source, cite source not in `sources`, id not matching basename, attestation present at draft stage, attestation null at verified stage.
- `test/validate.test.ts`: table test over `fixtures/invalid`, where each file fails with its named rule and no other error rule, plus every valid fixture passes.

### 0c corpus and resolver (lane B)

- `sources/manifest.json`: an array of `{ id, author, title, year, edition, language, kind: "folklore"|"literary"|"record", public_domain: true, pd_reason, locator: "page"|"headword", origin: { type: "ia", item, files } | { type: "wikisource", page, revision_id }, raw: [{ name, sha256, bytes }], pages_file, pages_sha256, notes }`. The eleven ids above. Item ids come from the research report. Karadžić 1818 is `srpskirjecnik00kara`. Note Frombald's `pd_reason` as 1725 with Wikisource CC0/PD transcription, and record in `notes` that the Wikisource header's "Arzt" for Frombald is wrong (he was Kameralprovisor).
- `src/corpus/fetch.ts`: downloads `_djvu.xml` and `_page_numbers.json` for each IA source, and the raw wikitext pinned to `revision_id` for Frombald, into `sources/raw/<id>/`. It sends a descriptive User-Agent (`beasts-corpus/0.1 (+https://github.com/brac/beasts)`), runs at most 2 concurrent requests and retries with backoff on 429/5xx. Idempotent: it skips a file whose sha256 already matches. File names with spaces and diacritics are URL-encoded.
- `src/corpus/djvu.ts`: a streaming scanner from djvu.xml to `{ leaf, text }[]`, joining `<WORD>` text with spaces and lines with newlines.
- `src/corpus/build.ts`: writes `sources/pages/<id>.jsonl`, one line per leaf, `{ "leaf": n, "page": "243" | null, "text": "..." }`, sorted by leaf, with stable key order and `\n` endings, then writes the sha256 back into the manifest. Frombald is split on `{{Seite|N}}`. Deterministic: two runs produce byte-identical output.
- `src/corpus/normalize.ts`: the normalisation function above, exported and unit-tested.
- `src/corpus/resolve.ts`: `resolve(tag) -> { ok: true, source, pages: [{ page, leaf, text }] } | { ok: false, reason }`. It parses the tag grammar. `p.`/`pp.` look up printed page strings. `s.v.` tries a normalised headword match at line start, then `sources/headwords/<id>.json`.
- `sources/headwords/karadzic1818.json` and `karadzic1852.json`: curated overrides for at least Дрекавац, Вампир and Вукодлак. Each row is `{ headword, leaf, ocr_spelling }`, found by searching for the OCR spelling and the German gloss.
- `src/corpus/cite-cli.ts`: `npm run cite -- <tag>` prints source, page and text. Exit 1 with the reason on failure.
- `src/corpus/find-cli.ts`: `npm run find -- <term> [--source <id>] [--limit N]` prints `tag  snippet` lines over normalised text (default limit 50). This is the tool Phase 1 draft agents use to locate passages.
- `src/corpus/verify.ts`: recomputes every pages-file sha256 against the manifest, and checks raw files when they are present. It prints `N sources ok`.
- `test/normalize.test.ts`, `test/resolve.test.ts`: unit tests on small inline fixtures (no dependency on the full corpus). `test/corpus.integration.test.ts` runs the cite rows below against the real `sources/pages/`.

### 0d seam (serial, merged tree)

- `src/validate/validate.ts`: rule R-CITE-RESOLVES. Every cite resolves through `resolve()`, and a `pp.` range spans at most 15 pages. Severity is error at both stages. Fixtures switch to real resolvable tags. Add `fixtures/invalid/cite-unresolvable.json`.
- `prompts/draft.md` (version header `draft-v1`): the draft agent's role. It reads only through `npm run find` and `npm run cite`, never from memory. Every clause carries a tag it has opened with `cite`. Empty fields are explained in `notes`, with kind `empty-field`. It leaves `attestation` null and `image` null. It validates with `--stage draft` before finishing. It lists the creature's expected sources from the coverage table. It forbids Wikipedia, Wikidata and modern scholarship as cited sources.
- `prompts/verify.md` (version header `verify-v1`): the verify agent's role. It never sees the drafting transcript, only the draft JSON. It opens every cite and judges whether the passage says the clause. It removes, downgrades or re-tags, and logs each action in the verify log. It assigns the grade by the brief's four definitions, with rationale clauses. It writes accretion notes (Stoker and so on). It validates with `--stage verified` and `--log`.
- `prompts/creatures.json`: the ten pilot creatures, with id, family, regions and the coverage table's expected source pages, as a starting index for the draft agent (hints, not claims).
- `docs/BACKLOG.md`: append the 0d decisions.

## Stop conditions

Gates for 0a, 0b and 0c are run in their lanes. The full battery runs once on the merged tree in 0d, and again by the reviewer at the `phase-0` tag.

| # | Command | Expected observable | Hard or print |
| --- | --- | --- | --- |
| 1 | `npm ci` | exit 0 | hard |
| 2 | `npm run typecheck` | exit 0, no output | hard |
| 3 | `npm test` | all files pass; print file and test counts | hard |
| 4 | `npm run validate -- fixtures/valid/draft --stage draft`; `npm run validate -- fixtures/valid/verified --stage verified`; `npm run validate -- fixtures/valid/log --log` | each prints `N valid, 0 invalid` with N ≥ 1 | hard |
| 5 | `npm run validate -- fixtures/invalid/<each>.json` | exit 1, and the issue line names the file's rule | hard (covered by the table test; also run 2 by hand) |
| 6 | `npm run corpus:build` twice, sha256 of `sources/pages/*` both times | identical hashes | hard |
| 7 | `npm run corpus:verify` | `11 sources ok` | hard |
| 8 | `npm run cite -- machal1918:p.267` | text contains normalised `poludnic` | hard |
| 9 | `npm run cite -- ralston1872:p.123` | contains `bannik` | hard |
| 10 | `npm run cite -- afanasyev1868:p.69` | normalised text contains `банник` | hard |
| 11 | `npm run cite -- afanasyev1869:p.586` | normalised text contains `яга` | hard |
| 12 | `npm run cite -- karadzic1818:s.v.Дрекавац` | resolves; text contains `Ziege` | hard |
| 13 | `npm run cite -- frombald1725:p.11` | resolves; print the spelling of the Plogojowitz name found | hard (resolves), print (spelling) |
| 14 | `npm run cite -- machal1918:p.9999` | exit 1, reason `page not found` | hard |
| 15 | `npm run find -- леший --source afanasyev1868` | at least one hit tagged within pp. 326-349 | hard |
| 16 | `npm run find -- lesiy --source machal1918` | at least one hit tagged within pp. 261-263 | hard |
| 17 | `du -sh sources/pages` | print size; stop and report if over 40 MB | print, hard over 40 MB |
| 18 | `git status --short` after the build | no tracked raw files; `sources/raw/` ignored | hard |
| 19 (0d) | `npm run validate -- fixtures/invalid/cite-unresolvable.json` | exit 1, rule R-CITE-RESOLVES | hard |
| 20 (0d) | `prompts/draft.md`, `prompts/verify.md` | exist with version headers `draft-v1`, `verify-v1` | hard |

If a cite row fails because the research's page number is off by OCR or pagination, the
implementer reports the page where the term actually sits. The reviewer amends the row
here with that evidence. The implementer never edits the expected value.

## Out of scope

- Any entry under `data/entries/`. That is Phase 1.
- Image generation, style tokens, plate format and any image provider SDK. Those are Phase 2 and blocked on Ben.
- A web front end or site.
- Extra sources beyond the eleven ids (Milićević, Glasnik Zemaljskog muzeja and the like). They are logged in the backlog.
- Calling the Claude API or any paid service.
- Do not commit. The reviewer commits after approval.

## Report format

Write the report using the phase-loop `templates/milestone-report.md`, to the path named in the brief.

## Post-review amendments

- (none yet)
- 2026-10-26: `--stage` is required on `validate` for entries; there is no default. Rejected: defaulting to draft, because a forgotten flag would silently skip the verified-stage rules.
- 2026-10-26: `resolve()` rejects `p.`/`pp.` tags on `locator: "headword"` sources. IA page numbers for Karadžić 1818 have confidence 16. Rejected: stripping page numbers from the build, because leaves still need them for display.
- 2026-10-26: `grade_rationale` in the verify log is `Clause[]` (minItems 1), mirroring `attestation.rationale`. Rejected: a plain string, which could carry an uncited claim.
- 2026-10-26: Drafts and verified entries live apart. The draft agent writes `data/drafts/<id>.json`, which is validated with `--stage draft` and never edited after hand-off. The verify agent writes `data/entries/<id>.json` with `--stage verified`, plus `data/verify-log/<id>.json`. Rejected: verify overwriting the draft in place, which destroys the before-and-after that evaluation question 2 counts.
- 2026-10-26: The Frombald pages file has the wiki markup stripped; the raw wikitext stays hash-pinned in the manifest. Accepted as auditable.
- 2026-10-26: The verify agent may remove, narrow or re-tag clauses and may write notes and the grade, but may not add new content clauses. Rejected: letting verify fill gaps, because then it would grade its own work.
