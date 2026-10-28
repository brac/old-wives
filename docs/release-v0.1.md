# Old Wives v0.1.0: the Slavic pilot

*Old Wives: a field guide to Slavic folklore creatures.* A bestiary in which every claim
carries a citation tag that resolves to a page of a public-domain source, so each claim
can be checked against the text it came from.

## What is in this release

- **Ten entries** (`data/entries/`): baba-yaga, bannik, domovoi, drekavac, leshy,
  poludnitsa, rusalka, vampir, vodyanoi and zmey-gorynych. Each was drafted by one agent
  from the cited sources and checked by a second agent that had not seen the draft and
  that assigned the attestation grade: seven `widely-attested`, two `regional`, one
  `literary`. The JSON schema is in `schema/entry.schema.json`.
- **Ten plates** (`plates/slavic/`): monochrome silverpoint studies, one per creature,
  each approved by eye. They are drawings after the folk tradition rather than
  reconstructions from the sources, and every entry says so (`image.interpretive`). The
  style is specified in `style/STYLE-SHEET.md`. Generating every candidate across the
  whole plate phase cost an estimated $5.21 (151 requests, `plates/spend.json`).
- **The corpus** (`sources/`): per-page text of eleven public-domain works in English,
  Russian, Serbian, Czech and German, with each work's edition, origin and hashes in
  `sources/manifest.json`.
- **The pipeline** (`src/`): corpus fetch, build and verify; citation resolution
  (`npm run cite`); entry validation; plate generation and finalisation.
- **The book site** (`site/`): one spread per creature, a contents page, the scope note
  and the method page. It also serves the data as static JSON at
  `/data/slavic/index.json`, `/data/slavic/<id>.json`, `/data/schema/entry.schema.json`
  and `/data/LICENSE`.

## Licences

- Code: MIT (`LICENSE`).
- Dataset (`data/`, `plates/slavic/`, `schema/`): CC BY 4.0 (`LICENSE-DATA`). Cite as
  *Old Wives: a field guide to Slavic folklore creatures*, v0.1.0, by brac (2026).
- Source texts (`sources/pages/`) and style references (`style/refs/`): public domain.

## What is not in this release

- Full-resolution plate masters. Only the web and thumbnail sizes are in the repository.
- The R2 bucket and release zips for those masters.
- Further creatures beyond the ten pilot entries, and the other volumes of the bestiary.

## Found an error?

Open an issue with the **Entry correction** template: the entry id, the clause, its cite
tag, the correction, and a source for it.

## Thanks

To the collectors and scholars whose public-domain work this is built on: A. N.
Afanasyev, Vuk Stefanović Karadžić, W. R. S. Ralston, Jan Máchal, Karel Jaromír Erben,
Augustin Calmet (in Henry Christmas's translation) and the 1725 Frombald report; and to
the Internet Archive and Wikisource, which hold the scans and transcriptions.
