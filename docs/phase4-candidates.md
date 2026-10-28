# Phase 4 candidates: corpus coverage (milestone 4b-0)

Coverage check for the planner's candidate list (`plans/phase-4.md`, appendix) and its
reserve list, run on 2026-10-28 against the eleven sources in `sources/manifest.json`.

**Result: 17 of 30 slots survive.** The appendix list plus the whole reserve list yields
16 kept candidates and 1 kept reserve. The brief's rule is to stop at what survives and
not invent coverage, so the three batches below hold 6, 5 and 6 creatures, and 13 slots
are open. Candidates that probed well but are not on the planner's lists are listed at the
end as suggestions only; none was added.

## Method

Every spelling was matched as a word-start prefix (or a whole word, for short forms such as
`vila`, `ala`, `mora`, `лихо`) over text passed through `src/corpus/normalize.ts`, so pre-reform
letters (ѣ, і, word-final ъ) fold the same way `npm run find` folds them. `npm run find`
itself is a raw substring match, which over-counts short names (`vila` matches `village`),
so the scan used the same normaliser with word boundaries added. Every hit set was read in
snippet form before a decision was made; hit counts are pages with at least one match.
Karadžić's dictionaries are headword-cited, so their rows give `s.v.` headwords, not pages.
Counts for common words (`мора` is also "must" and "of the sea" in Serbian, `лихо` is also
"badly") include noise; the page ranges given are the ones where the snippet is about the being.

Decisions: **keep** (distinct being, at least one source), **variant** (name variant of a
pilot entry or another candidate), **god** (out by the scope test), **no hits** (no page
about the being; slot goes to the reserve).

## Planner's list

| id | family | batch slot | decision | sources (hit pages; ranges about the being) | reasoning for non-keep |
|---|---|---|---|---|---|
| kikimora | household | 1 | keep | machal1918 1 (228); ralston1872 3 (133, 174); afanasyev1868 4 (101-102, 578); afanasyev1869 8 (136-137, 405) | |
| dvorovoi | household | 1 | variant of domovoi | afanasyev1868 2 (89, 109) | Afanasyev 1868 p. 89: the domovoi "is called домовой or дворовой", with дворовик as "another form"; the other hits are "дворовый человек" (a household serf). |
| bolotnik | water | 1 | no hits | none | No page names bolotnik, болотник, bagnik or багник. |
| vila | water | 1 | keep | machal1918 9 (256-260); ralston1872 7 (127, 146-147, 430); ralston1873 1 (205); afanasyev1869 62 (152-193); karadzic1818 21, karadzic1852 45 (s.v. вила, самовила) | |
| polevik | field | 1 | keep | machal1918 2 (268-269); afanasyev1868 1 (330); afanasyev1869 2 (771) | |
| upyr | undead | 1 | variant of vampir | machal1918 (231); ralston1872 (410); ralston1873 (321); afanasyev1869 (535-570) | The sources give upir/упырь as the Russian name of the vampire (Ralston 1872 p. 410: "vampir [South-Russian upuir, anciently upir]"); the pilot vampir row already carries upir, upyr, упырь. |
| likho | disease-and-fate | 1 | keep | ralston1873 8 (178-184); afanasyev1868 8 (696-700); afanasyev1869 15 (396-397, 404); machal1918 1 (252, as "nedolya, licho") | |
| koschei | monster | 1 | keep | ralston1872 12 (164-168); ralston1873 30 (84-120); afanasyev1868 17 (594-604) | |
| alkonost | other | 1 | keep | afanasyev1868 1 (135); afanasyev1869 2 (221) | Thin: two pages, both paired with sirin. |
| ovinnik | household | 1 | variant of domovoi | afanasyev1868 (69) | No page names овинник or ovinnik; the "ovin" hits are the barn itself. Afanasyev 1868 p. 69 gives подовинник (and гуменник) as names applied to the house spirit. |
| navka | undead | 2 | keep | machal1918 3 (253-255); ralston1872 3 (145); afanasyev1869 14 (145-149, 241-242) | Overlap risk: Machal's chapter is "Navky and Rusalky", already a pilot rusalka hint; Machal p. 253 defines the navky separately (souls of unbaptised children). |
| vodyanitsa | water | 2 | variant of rusalka / vodyanoi | afanasyev1868 2 (213, 239) | p. 239 lists водяницы among the names of the water maidens with русалки; p. 213 is the wife of the водяник in one tale. Not treated as a distinct being. |
| zlydni | disease-and-fate | 2 | keep | afanasyev1868 1 (699); afanasyev1869 6 (404-408) | Family moved from the planner's "household" to disease-and-fate: Afanasyev treats them under fate (судьба, доля и недоля). |
| polunochnitsa | field | 2 | keep | ralston1872 1 (148); afanasyev1869 2 (77) | Thin: one sentence each ("twelve midnight sisters"). afanasyev1865 p. 224 is a charm to the dawn, not this being. |
| psoglav | monster | 2 | no hits | karadzic1852 1 (one proverb) | The only hit is "псоглава" inside a proverb under another headword; no description of a being. |
| bukavac | water | 2 | no hits | karadzic1852 1 (s.v. бука) | Karadžić glosses букавац as "водени бик", Latin Ardea stellaris: the bittern, a bird, not a water monster. |
| karakondžula | undead | 2 | no hits | none | No page names karakondžula, караконџула or a spelling of it. |
| tryasavitsy | disease-and-fate | 2 | keep | ralston1872 1 (393, "fever-sisters"); afanasyev1869 35 (73-101, the лихорадки) | |
| gamayun | other | 2 | no hits | none | No page names гамаюн or gamayun. |
| lesovik | forest | 2 | variant of leshy | machal1918 1 (261); afanasyev1868 6 (326-349) | Machal p. 261: "lesiy, lesovik"; Afanasyev 1868 p. 326 lists лесовик among the names of the лешій. The pilot leshy row already has лесовик. Its fallback, bagnik, has no hits. |
| domovikha | household | 3 | no hits | none | No page names домовиха or a spelling of it. |
| obderikha | household | 3 | no hits | none | No page names обдериха, банниха or a spelling of it. |
| mora | other | 3 | keep | machal1918 1 (228); ralston1872 2 (133-134); karadzic1818, karadzic1852 (s.v. мора); afanasyev1868 (101-102) | Machal p. 228 ties the mora to the kikimora ("the moras, or kikimoras"); both kept, since every other source treats the mora as a night-pressing spirit across Serbs, Czechs and Poles. Most Karadžić and Afanasyev hits are noise ("must", "sea"). |
| stuhac | forest | 3 | keep | karadzic1852 2 (s.v. стухаћ) | Thin: one dictionary entry (Herzegovina, mountain beings "like vile or devils"). |
| morovaya-deva | disease-and-fate | 3 | keep | afanasyev1865 1 (529); afanasyev1869 15 (103-113) | The planner's "plague maiden"; the corpus name is моровая дева. |
| zmaj | monster | 3 | variant of zmey-gorynych | karadzic1818 5, karadzic1852 16 (s.v. змај, ала, аждаха) | Karadžić glosses змај as "der Drache, draco", cross-referred to ала and аждаха, with no separate description; the pilot zmey-gorynych row already carries змај as the generic zmey. |
| ala | monster | 3 | keep | karadzic1852 (s.v. ала, аждаха); afanasyev1868 1 (519) | Karadžić 1852: ала is the аждаха, thought to drive clouds and hail onto crops. |
| vukodlak | undead | 3 | variant of vampir | karadzic1818, karadzic1852 (s.v. вампир, вукодлак); ralston1872 (404-410); machal1918 (228-229) | Karadžić, the Serbian source, defines вампир as "vide вукодлак"; the pilot vampir row already has both headwords. Ralston and Machal use the cognates for the werewolf, which is a separate being (see suggestions). |
| firebird | other | 3 | keep | ralston1873 7 (235, 284-287); afanasyev1865 8 (512-514); afanasyev1868 4 (295, 311) | |
| indrik | monster | 3 | keep | afanasyev1868 3 (133, 553-554) | Thin: the "индра-зверь" of the Dove Book verse, p. 553. |

## Reserve list

| id | family | decision | sources | reasoning |
|---|---|---|---|---|
| chugaister | forest | no hits | none | No page names чугайстр or a spelling of it. |
| veles (bear forms) | | god | | Out by the plan itself. |
| nocnitsa | other | no hits | none | No page names ночница, nocnica or noćnica. |
| blud | forest | no hits | afanasyev 5 (noise) | Every hit is блуд "fornication"; no being. |
| shishiga | other | no hits | none | No page names шишига. |
| vodyanoi's female counterpart | water | variant | afanasyev1868 (213, 239) | Same pages as vodyanitsa above. |
| sirin | other | keep (fills batch 2) | afanasyev1868 1 (135); afanasyev1869 2 (153, 221) | Thin, paired with alkonost. |
| lel | | god | afanasyev1868 (488); afanasyev1869 (680) | Afanasyev treats леля as a kinship word and as the same as the goddess Lada; out by the scope test. |

## Batches

Each batch spans at least four families (schema `family` values) and none is all
household spirits. Thirteen slots are open.

| batch | creatures | families |
|---|---|---|
| 1 | kikimora, vila, polevik, likho, koschei, alkonost | household, water, field, disease-and-fate, monster, other (6) |
| 2 | navka, zlydni, polunochnitsa, tryasavitsy, sirin | undead, disease-and-fate, field, other (4) |
| 3 | mora, stuhac, morovaya-deva, ala, firebird, indrik | other, forest, disease-and-fate, monster (4) |

## Suggestions to fill the open slots (not adopted)

Probe counts from the same scan; these were not read page by page and are not hints.
Adding any of them is the planner's or Ben's call.

- rozhanitsy / sudice / sudjenice (fate maidens): machal1918, afanasyev1869 21 pages, karadzic, erben1893.
- dolya / nedolya (personal fate): machal1918 3, afanasyev1869 27 pages (389-404); overlaps likho and zlydni.
- oboroten / vlkodlak (werewolf, distinct from the vampire): ralston1872 (404-410), machal1918 (228-229), afanasyev1869 46 pages.
- zduhać: machal1918 2, karadzic1852 1.
- vještica / vedma (witch): karadzic 21, afanasyev ~280 pages; scope (human or being) to be ruled.
- skřítek: machal1918 4. bludička: erben1893 9. divoženka: machal1918 1.
