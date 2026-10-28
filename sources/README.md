# Sources

`sources/pages/` holds the source corpus: per-page text of public-domain works, one
JSONL file per work. Each work's author, edition, archive item and the reason it is in
the public domain are recorded in `sources/manifest.json`, which also holds the hashes
`npm run corpus:verify` checks. `sources/headwords/` holds headword indexes built from
the dictionaries in the corpus. The source texts are public domain and are not covered by
this repository's MIT or CC BY 4.0 licences.

`style/refs/` holds the three public-domain artworks (PD-Art: faithful reproductions of
two-dimensional works whose copyright has expired) used as style references for the
plates. Each file's artist, date, source and licence status are recorded in
`style/refs/manifest.json`.
