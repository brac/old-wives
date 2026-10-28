# Changelog

All notable changes to this project are recorded here. Versions follow
[Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-10-28

First public release: the Slavic pilot.

### Added

- Ten creature entries in `data/entries/`, each drafted from cited public-domain sources
  and independently verified: baba-yaga, bannik, domovoi, drekavac, leshy, poludnitsa,
  rusalka, vampir, vodyanoi and zmey-gorynych. Attestation grades: seven
  `widely-attested`, two `regional`, one `literary`.
- The entry and verify-log JSON schemas in `schema/`.
- Ten monochrome silverpoint plates in `plates/slavic/`, one per entry, with each plate's
  prompt, model, seed and cost recorded. Every plate is marked interpretive.
- A per-page corpus of eleven public-domain works in five languages under
  `sources/pages/`, with hashes and origins in `sources/manifest.json`, and the `cite`
  and `find` tools to resolve and search it.
- The plate style sheet, `style/STYLE-SHEET.md`, and its three public-domain style
  references in `style/refs/`.
- A static book site in `site/` (Astro): one spread per creature, a contents page, the
  scope note and the method page, plus the entries as static JSON under `/data/`.
- Licences: MIT for code (`LICENSE`), CC BY 4.0 for the dataset (`LICENSE-DATA`).
- An issue template for entry corrections.
