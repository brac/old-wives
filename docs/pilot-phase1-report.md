# Slavic pilot, Phase 1 report: draft and verify

Written 2026-10-27 at the end of milestone 1c. Phase 1 drafted and verified all ten pilot
creatures with the frozen prompts (draft-v1, verify-v1) and produced no art. This report
answers evaluation questions 2, 3 and 6, gives a provisional answer to question 1, and
covers deliverable 5 ("what the verify stage removed from each draft, and why") for
stages 1 and 2. Every number below comes from `npm run stats`, which reconciles each
creature (draft checkable items = verified items + removed) and exits 1 on a mismatch.
All ten reconcile.

## Summary

- **Verify removed very little.** Outside the three planted canaries it removed 2 items
  out of 825 drafted, and both were moved for being in the wrong field, not for being
  false. It narrowed 17 clauses, retagged 1 and flagged 39 for Ben.
- **All three canaries were caught**, but only the baba-yaga one was a fully blind test.
- **The easy entries show no padding.** Domovoi lost nothing apart from its canary, and
  baba-yaga lost one misplaced clause.
- **Grades:** 7 widely-attested, 1 regional (zmey-gorynych) and 2 literary (bannik and
  drekavac). Drekavac was expected on regional. The literary grades come from a rule that
  three verifiers applied differently, and that rule needs a decision from Ben (below).
- **Question 1, provisional:** 8 of 10 appearance fields look clean enough to generate
  from, two of them only just. Drekavac and vodyanoi do not.

## Stats table

Checkable items are as defined in `prompts/verify.md` section 2. "Removed" leaves the
canaries out. "Added notes" are cited notes the verifier wrote itself, and they are not
counted in "verified".

| Creature | Draft items | Verified items | Removed | Canary | Downgraded | Retagged | Flagged | Grade | Appearance clauses | Scene instead | Variants | Name variants | Peoples |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| baba-yaga | 63 | 61 | 1 | 1 caught | 1 | 0 | 3 | widely-attested | 10 | no | 3 | 3 | 4 |
| bannik | 20 | 20 | 0 | - | 0 | 0 | 1 | literary | 0 | yes (4) | 0 | 1 | 1 |
| domovoi | 103 | 102 | 0 | 1 caught | 1 | 0 | 3 | widely-attested | 11 | no | 4 | 10 | 6 |
| drekavac | 9 | 9 | 0 | - | 3 | 0 | 3 | literary | 1 | no | 0 | 0 | 1 |
| leshy | 147 | 147 | 0 | - | 1 | 1 | 5 | widely-attested | 28 | no | 1 | 9 | 3 |
| poludnitsa | 105 | 105 | 0 | - | 1 | 0 | 5 | widely-attested | 0 | yes (7) | 6 | 9 | 4 |
| rusalka | 112 | 112 | 0 | - | 2 | 0 | 4 | widely-attested | 15 | no | 4 | 1 | 4 |
| vampir | 101 | 101 | 0 | - | 1 | 0 | 5 | widely-attested | 17 | no | 3 | 6 | 9 |
| vodyanoi | 127 | 125 | 1 | 1 caught | 5 | 0 | 6 | widely-attested | 20 | no | 2 | 8 | 7 |
| zmey-gorynych | 38 | 38 | 0 | - | 2 | 0 | 4 | regional | 7 | no | 0 | 4 | 1 |
| **Total** | **825** | **820** | **2** | **3 of 3** | **17** | **1** | **39** | | | | | | |

Verifier-added cited notes: 2 in baba-yaga and 2 in vampir. Poludnitsa has no top-level
appearance by design: its appearance sits in its six variants (68 variant items).

Draft items by field, summed across the ten:

| native | name variants | meaning | peoples rows | appearance | scene | behaviour | dealing | origin | variant clauses | cited notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 27 | 51 | 31 | 68 | 113 | 69 | 204 | 95 | 29 | 132 | 6 |

## What verify did to each entry

R = removed, D = downgraded (narrowed), T = retagged, F = flagged. The reasons are
condensed from `data/verify-log/<id>.json`.

- **baba-yaga.** R canary `/appearance/4`, "a single eye in the middle of her forehead":
  pp.161-164 are silent, and the one-eyed figure on p.154 is the leshy. R `/appearance/11`,
  "chases fugitive heroes as 'a black cloud'": this is an action, so it belongs in
  behaviour, not appearance. D `/appearance/0`: "hideous" was cut, because appearance
  takes no evaluative words. F: an ambiguous "she" in the White-Russian passage about
  Death; the people of the native form баба-яга (the page says only "the Slavic tribe");
  and "Voroneje", which is a reading of OCR "Vcroneje".
- **bannik.** Nothing was removed or narrowed. F `/names/variants/0`, баннаго: Russians is
  fixed only by context, and the paragraph just before is about Galicia and Poland.
- **domovoi.** R canary `/appearance/2`, "tall felt hat": Machal p.240 gives his hair,
  eyes, coat, cloak, belt and shirt, but no hat. D `/dealing_with_it/13`: the "four
  corners of the stall" became "of the building", as on Ralston p.126. F: Lusatia mapped
  to Sorbs; and two clauses that Ralston says hold "everywhere" or "in other places" but
  that were filed under the Viatka variant.
- **drekavac.** D: "it is met at night" became "a nocturnal animal"; "its presence is
  known by a scream" lost the detection framing; and the gloss "believed in rather than
  known" was cut back to the single word "vermeintliches". F: the reading "der Schreyer"
  from the Fraktur OCR, and the OCR-garbled 1852 Latin behind two clauses that the 1818
  page fully supports.
- **leshy.** D `/notes/1`: "and noises" was cut, because Afanasyev p.330 interprets his
  size, not his noises. T `/behavior_habitat/38`: p.156 became pp.155-156, because the
  passage runs across the page break. F: "the sign of the cross is distasteful to demons"
  is said of demons in general; Kief and Chernigof filed as Russians; Ukrainians standing
  for "Little-Russia"; and two OCR-split native forms (лисунъ, полисунъ).
- **poludnitsa.** D `/notes/4`: the note named vol. 1 p.23, but the cited page is p.25.
  This is the old-label residue of the page-number fix (see process findings). F: Machal's
  relative clause "wanders about the fields at noon" may describe only the old-woman form;
  Polednica as Czech rests on the next sentence; "Potudniowka" read as Poludniowka; and
  Erben's OCR "o poludnice".
- **rusalka.** D: "Afanasyev's peasant informants" became "the tales of villagers", as the
  page says; and the White-Russian setting was cut from appearance, leaving "naked women
  and children". F: that sentence does not call them Rusalkas, and two Whit-Sunday
  practices may belong to Saratof only.
- **vampir.** D `/dealing_with_it/1`: Machal credits exhuming, staking and burning
  together, not burning alone. F: upuir ("South-Russian") read as Ukrainians; the Ukraine,
  White-Russia and Kharkov filed as Russians; Karadžić's "40" against "10" days, which
  differ by OCR and by edition; and "cannot pass" the crossed gates, which is a fair but
  interpretive reading.
- **vodyanoi.** R canary `/behavior_habitat/17`, "flees at the sound of church bells":
  p.151 is silent, and the bells on p.150 belong to the drowned girl. R `/appearance/14`,
  "can transform himself": this is a capacity, so it belongs in behaviour. D (four
  appearance clauses, one attribute each): the belly and face split off; "combs his long
  green hair" became "has long green hair"; the green hair was cut from the
  green-beard clause; "floating and naked" was cut from the log sighting. D
  `/dealing_with_it/9`: "is not eaten" became "people are advised not to eat". F: five
  native forms and the Konchozero story with Russians inferred, and водовикъ, which may be
  Belarusian.
- **zmey-gorynych.** D: "lord of the *cloud* mountains" was restored, because dropping
  "cloud" made Afanasyev's mythological reading look literal; and Marina is no longer
  called a "sorceress". F: four appearance clauses describe the Zmyei in general and tie
  him to Gorynych only through a patronymic he "sometimes" bears.

## Question 2: how much did verify remove or downgrade?

Leaving out the canaries, verify removed 2 items and downgraded 17, out of 825. Neither
removal was fabricated content: both were true clauses filed in the wrong field. Most
downgrades enforce the appearance rules (no evaluative words, one attribute per clause,
no behaviour in appearance) or narrow an attribution to what the page actually says.

**The easy entries:** domovoi had 0 removals and 1 downgrade, and baba-yaga had 1 removal
(misplaced) and 1 downgrade (a style word). These are the counts the brief singles out,
and they show no sign of a draft padding from memory. One caution: verify checks only
the pages a draft cites (see blind spots below), so a low count proves that what was
cited is supported. It does not prove that nothing was left out.

### Canaries

| # | Entry and pointer | Planted text | Tag | Caught | Blindness |
| --- | --- | --- | --- | --- | --- |
| 1 | domovoi `/appearance/2` | He wears a tall felt hat. | machal1918:p.240 | yes, on page evidence | **contaminated**: the commit subject "test: plant verify canary in the domovoi draft" reached the verifier through the harness's recent-commits list, and its report calls it "the planted canary" |
| 2 | vodyanoi `/behavior_habitat/17` | He flees at the sound of church bells. | ralston1872:p.151 | yes, on page evidence | semi-blind: planted uncommitted, but the verifier knew canaries might exist (from canary 1's commit subject) and saw the draft modified in `git status` |
| 3 | baba-yaga `/appearance/4` | She has a single eye in the middle of her forehead. | ralston1872:p.162 | yes, on page evidence, despite a one-eyed decoy on p.154 | **blind**: the report shows no awareness of canaries |

`stats` matches the canaries by exact text, counts them apart from the other removals,
and confirms that none survives in an entry. The one clean blind result is a single
sample. It is encouraging, but it is not a measured catch rate.

## Question 3: did the grades land where expected?

| Creature | Expected | Landed | Note |
| --- | --- | --- | --- |
| drekavac | regional | **literary** | one author, Karadžić, counted once across his 1818 and 1852 dictionaries |
| vampir | widely-attested, with the Stoker line | widely-attested | the editorial note excluding Stoker's *Dracula* (1897) and later fiction is in the entry; four independent authors and nine peoples |
| bannik | none stated | **literary** | Afanasyev 1868, with Ralston counted as dependent on him |
| zmey-gorynych | none stated | regional | one people; Afanasyev quotes bylina and song texts |
| all others | none stated | widely-attested | |

**The literary grades are a finding, not a failure.** The brief says that a grade
landing on literary is the system working. But both literary grades here rest on a rule
that verifiers applied differently. The bannik and drekavac verifiers each graded
literary because the entry rests on "one 19th-century compiler". The zmey-gorynych
verifier faced the same pattern, one author passing on folk material, and graded
regional, because Afanasyev prints the bylina and song texts themselves (Kirsha Danilov,
Kireevsky and others) and so "this is not cabinet mythology".

**The principle question for Ben:** is a single folklore *collector* (Afanasyev, or
Karadžić, whom the manifest classes as `folklore`) the same as the brief's "one
19th-century compiler, possible cabinet mythology"?

- **If a collector is not that compiler,** bannik and drekavac move to regional, which
  puts drekavac where the brief expected it, and zmey-gorynych stands.
- **If a collector is that compiler,** zmey-gorynych should drop to literary as well.

The drekavac verifier also asked whether a fifth grade is needed for this case.

**Ralston's independence was counted inconsistently.** The leshy verifier counted
Ralston 1872 as independent of Afanasyev, while the bannik, rusalka, vodyanoi and
poludnitsa verifiers counted the two as one source. The grade impact is **none**:
leshy keeps Machal and Afanasyev as two independent authors either way, so it stays
widely-attested. The baba-yaga verifier counted Ralston and Afanasyev as two authors
"not wholly independent" and still graded widely-attested over four peoples. That grade
holds only if Ralston counts at least in part. It is worth a look when the rule is fixed.

## Question 6: rusalka variants and poludnitsa names

**Rusalka.** The general description stays at the top level: 15 appearance clauses for
the beautiful maiden with green hair. Four regional variants nest under it:

- `saratov` (Russians): hideous, humpbacked, hairy, clawed, carrying an iron hook. This
  is the cleanest contrast.
- `astrakhan` (Russians) and `little-russia` (Ukrainians): behaviour only, with no
  appearance clauses.
- `white-russia` (Belarusians): "naked women and children", flagged because the sentence
  does not name them Rusalkas.

The nesting works. The open issue is that two `dealing_with_it` clauses may belong inside
`saratov` (flagged), which verify is not allowed to move.

**Poludnitsa.** One record carries 9 name variants across four peoples: Czechs
(Poludnica, Polednica, poludnice), Poles (Poludniowka, Przypoludnica), Sorbs (four
Pripoldnica-type forms) and Russians. It also has 10 peoples-regions rows and six
variants: `bohemia`, `moravia`, `poles`, `sorbs`, `russians` and `siberia`. The brief's
"three names and regions" is more than met, and without awkwardness. Each variant holds
its own appearance, and the top level keeps only scene clauses common to all. Two kinds
of strain show, both in the flags rather than in the structure: name rows whose people
is set by the next sentence (Polednica), and OCR-dependent spellings.

## Question 1, provisional: the ten appearance fields

Ben makes the final call. "Clean" here means a plate could be generated from these
clauses as they stand, picking from them but not rewriting them.

| Creature | Verified clauses (condensed quotes) | Clean? | Reason |
| --- | --- | --- | --- |
| baba-yaga | "an old woman"; "very tall"; "very bony of limb"; "a gaunt hag"; "excessively long nose", "sometimes ... of iron"; "dishevelled hair"; "long pendant breasts"; "strong sharp teeth"; lies stretched corner to corner, "nose goes right through the ceiling" | yes | one coherent figure, physical only |
| bannik (scene) | "The bath-house (banya)"; "Late hours of the night"; "Behind the stove or under the steaming shelf"; "whistling, laughter and howling ... from behind the stove" | yes | a complete setting for a scene plate |
| domovoi | "an old man"; "grizzled, bushy head of hair"; "flashing eyes"; "thick, soft coat of hair", bare only round the eyes and nose; "long cloak girded ... light red belt"; "sometimes ... only a red shirt"; plus shapes: a household member, animals, Vazila with "equine ears and hoofs" | yes | the first seven clauses make one figure; the shape clauses are alternatives to leave out |
| drekavac | "a four-footed animal (Latin 'quadrupes')" | **no** | far too thin: any plate would be invented. This is the one-source problem, not a fault of the draft |
| leshy | 28 clauses: old man, long hair and beard, "flashing green eyes"; stature that changes with the trees; bear, wolf or hare; a peasant in sheepskin, ungirdled, "left skirt ... crossed over the right", "no eyebrows or eyelashes"; in his own shape "horns", "feet ... like those of a goat", "shaggy hair ... sometimes green", "long claws" | yes | the own-shape set is one coherent figure, but stature appears three times, so the plate needs a rule for choosing a form |
| poludnitsa (scene, plus 6 variants) | scene: "in the fields ... at harvest", "at noon", "from twelve to two"; poles variant: "a tall woman", "white robe reaching to her feet", "a sharp sickle"; moravia: "horses' hoofs", "slanting eyes" | yes | clean per variant. The plate must pick one variant (poles or sorbs is the most consistent) |
| rusalka | "beautiful maidens"; "snow-white bosoms"; "long and slender limbs"; "wild" eyes; "pale" complexion; hair "long, thick and wavy", "green as the grass"; dress of "green leaves or a long white shift"; poppies and "hair ... flying loose" in the corn | yes | coherent; the seven-year-old forms are alternatives to leave out |
| vampir | "assume every sort of shape"; "a man with a tail"; a Tambof stranger in "a red shirt", "a new jacket"; the undecayed corpse, "cheek is rosy", "skin is soft"; Plogojoviz "quite fresh", "hair and beard ... grown", "new nails", "fresh blood ... in the mouth" | borderline yes | no single figure, but the exhumed-corpse clauses (Machal plus the 1725 report) give a precise plate |
| vodyanoi | "a bald-headed old man" next to "long green hair"; "high cap of reeds" next to "tall boyar's cap ... green sedge"; "naked old man" twice; "fat belly", "great paunch"; "puffy cheeks", "bloated face"; plus fish, pike and fish-tail forms | **no** | duplicates and direct conflicts (bald against long hair, two caps): a plate needs an editorial merge |
| zmey-gorynych | "the many-headed Snake"; "twelve serpent trunks (khoboty)"; "flies"; "winged"; "fiery"; as a beautiful youth; as a mounted warrior with a raven and a hound | borderline yes | many-headed, winged, fiery and flying is drawable. Every Ralston clause repeats "The Serpent (Zmyei), who sometimes bears the patronymic Goruinuich", and all four are referent-flagged |

**Provisional count: 8 of 10**, which meets the target of 8 or more, with vampir and
zmey-gorynych borderline. Vodyanoi shows a template gap: the one-attribute rule split its
clauses, but nothing in the template makes the draft reconcile clauses from different
sources that contradict each other.

## Process findings

1. **Draft budget truncation.** The domovoi and rusalka draft agents ran out of their
   100k budget before reading every page that matched (Afanasyev vols. 2 and 3 were
   mostly unread), and each recorded the gap in a scope note. This was accepted for the
   pilot. Scaling needs a per-source split of the draft stage or a larger budget.
2. **The Afanasyev vol. 1 page-label defect.** The Internet Archive labels for
   `afanasyev1865` were 2 lower than the printed running header on 750 of 762 leaves.
   Fix round `phase-1-corpusfix` derived the labels from the headers. A leaf with no
   header number takes its neighbours' offset, because a flat +2 would have duplicated
   p.11. The fix added an audit test and mechanically relabelled the three poludnitsa
   tags. Its residue is the poludnitsa `/notes/4` downgrade: the note text still said
   p.23.
3. **Machal's plate leaves.** IA counted blank plate leaves in `machal1918`, so printed
   pp. 87-107 carry labels 91-115. No pilot tag cites that range, so it is recorded with
   a 90% audit floor and is in the backlog for a header relabel before scaling.
4. **s.v. citations stop at the leaf boundary.** `cite` prints one leaf, so a dictionary
   entry that runs onto the next leaf is cut short (karadzic1818 Вукодлак, leaf 122 to
   123).
5. **`family` is not a checkable item.** Drekavac's `family: "undead"` is supported by
   neither page, and the draft's own note says so, but verify-v1 may not touch it. The
   same is true of `related`.
6. **People-mapping questions came up again and again:** "Little-Russians" and
   Little-Russia mapped to Ukrainians; Lusatia to Sorbs; "Ruthenians" left as printed;
   Kief and Chernigof filed as Russians by the context rule; South-Russian to Ukrainians;
   and Kharkov filed as Russians. Each was flagged where it happened. They need one
   mapping table, not per-entry calls.
7. **Blind spots of a verify that checks only tags.** Verify opens only the pages a
   draft cites, so:
   - it cannot detect omissions, including the truncation in finding 1;
   - it cannot check uncited editorial notes (for example the Stoker exclusion, which is
     correct but unverified by design);
   - it cannot move a clause it finds in the wrong variant (domovoi's Viatka clauses,
     rusalka's Saratof practices). It can only flag it.
   - Two verifiers also noted that R-RELATED does not fire in single-file validation.
     Directory validation at this gate is clean: 10 valid, 0 warnings.

## Open decisions for Ben

1. **Grade rule:** does a single folklore collector count as the brief's "one
   19th-century compiler"? The answer decides bannik, drekavac and zmey-gorynych, and
   whether a fifth grade is needed.
2. **Ralston's independence:** fix one rule (dependent wherever he cites Afanasyev on the
   passage, or dependent wholesale) and apply it to all ten. No grade changes today,
   except possibly baba-yaga under the wholesale reading.
3. **People mapping:** settle the mappings for Little-Russia, Lusatia, Ruthenians,
   Kief/Chernigof, South-Russian and Kharkov.
4. **Question 1:** confirm or overturn the 8-of-10 judgement, especially vodyanoi (no),
   vampir and zmey-gorynych (borderline).
5. **Template changes before scaling:** have the draft reconcile contradicting
   appearance clauses, allow verify to move clauses between a variant and the top level,
   and make `family` checkable.
6. **Draft budget:** choose between a per-source split and a larger budget for the dense
   creatures.
