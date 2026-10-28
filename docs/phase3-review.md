# Phase 3 design review notes

Screenshots (full page, `docs/phase3-screens/<page>-<width>.png`, widths 1280 and 390):

| Page | URL | Files |
| --- | --- | --- |
| contents | `/` | contents-1280.png, contents-390.png |
| baba-yaga (figure spread) | `/creatures/baba-yaga/` | baba-yaga-1280.png, baba-yaga-390.png |
| bannik (scene-adjacent) | `/creatures/bannik/` | bannik-1280.png, bannik-390.png |
| leshy (dense) | `/creatures/leshy/` | leshy-1280.png, leshy-390.png |
| about | `/about/` | about-1280.png, about-390.png |
| method | `/method/` | method-1280.png, method-390.png |
| data | `/data/` | data-1280.png, data-390.png |

## Choices you are most likely to change

| Choice | Current value | One-line change |
| --- | --- | --- |
| Body type size | `--text: 1.125rem` (18px), `site/src/styles/book.css:15`; creature name `--title: 2.25rem`, line 20 | line 15: `--text: 1.25rem;` for 20px body |
| Page proportions | spread max `--spread: 76rem`, line 24; text column `--measure: 34rem`, line 23; spread is two equal columns, `.spread` `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)`, line 178 | line 178: `minmax(0, 5fr) minmax(0, 4fr)` to favour the plate; line 24: `--spread: 68rem` for a narrower book |
| Chip density | `--chip: 0.75rem` (12px), line 18; chip padding `0 0.35rem`, margin `0 0.15rem 0.1rem 0`, lines 320-321; one chip per cite, rendered by `site/src/components/Chips.astro` | line 18: `--chip: 0.6875rem;` for smaller chips, or add `.chip:not(:first-child) { display: none; }` to show one chip per clause |
| Variants open by default | `<details class="variant">` has no `open` attribute, `site/src/pages/creatures/[id].astro:147` (grade explainer at line 125 also closed) | line 147: `<details class="variant" open>` |

## Open questions that need Ben (from the 3c reports)

- Contents thumbnails have empty alt text; the creature name beneath is the link text. Keep, or give the image its own alt?
- OG/canonical URLs are root-relative until a `site` URL is set in `site/astro.config.mjs`. What is the public URL?
- Empty sections show "Nothing in the cited sources." (`[id].astro:138`). Keep that wording, or hide empty sections?
- The name's meaning section is headed "The name" (`[id].astro:102`). Keep, or retitle?

Not judged by the agent: nobody has looked at the screenshots yet.
