---
title: The data
description: How to get the Old Wives dataset as static JSON files, what the attestation grades mean, and how to cite it.
---

# The data

Everything on this site comes from an open dataset: one JSON record per creature, a
JSON Schema that every record validates against, and the plates. The site serves them
as static files, so anything that can make an HTTP request can read them. There are no
accounts and no API keys.

## Files

| Path | What it holds |
| --- | --- |
| `/data/slavic/index.json` | One row per entry: id, primary name, family, peoples, attestation grade and thumbnail path |
| `/data/slavic/<id>.json` | The full entry, exactly as it is stored in the repository |
| `/data/schema/entry.schema.json` | The JSON Schema for an entry |
| `/data/LICENSE` | The CC BY 4.0 licence text |
| `/plates/slavic/<id>.web.webp` | The plate at full web size |
| `/plates/slavic/<id>.thumb.webp` | The plate as a 400 px wide thumbnail |

`<id>` is the entry's id, for example `domovoi` or `baba-yaga`.

## Example

```js
const index = await fetch("/data/slavic/index.json").then((r) => r.json());

const domovoi = await fetch("/data/slavic/domovoi.json").then((r) => r.json());
console.log(domovoi.attestation.grade); // "widely-attested"
```

## The repository

The same files, with the history of every change, are on GitHub at
[github.com/brac/old-wives](https://github.com/brac/old-wives). The entries are in
`data/entries/`, the schema in `schema/entry.schema.json` and the plates in
`plates/slavic/`.

## Attestation grades

Every entry carries one of four grades. The grade is assigned by the verify stage, not
by the agent that drafted the entry, and the verifier's reasons are stored with it in
`attestation.rationale`.

| Grade | Meaning |
| --- | --- |
| `widely-attested` | Multiple peoples, multiple independent sources. |
| `regional` | One people, multiple sources. |
| `literary` | Traceable mainly to one 19th-century compiler; possible cabinet mythology. |
| `disputed` | Contested, or suspected modern invention. |

A `literary` grade is not a mark against an entry. It records where the evidence
comes from.

## Licence

The entries, the schema and the plates are released under Creative Commons Attribution
4.0 (CC BY 4.0). You may copy, adapt and reuse them, including commercially, as long as
you credit the source. The site's code is MIT.

## How to cite

> Old Wives: a field guide to Slavic folklore creatures, v0.1.0 (2026).
> https://github.com/brac/old-wives. CC BY 4.0.

When you cite a single entry, add its id, for example `domovoi`.
