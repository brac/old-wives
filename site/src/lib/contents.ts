// No imports: astro.config.mjs and the contact-sheet script read this file too.

/**
 * The contents order of volume 1: the order the ten plates appear in
 * style/STYLE-SHEET.md ("The ten plates"). site/test/entries.test.ts checks that this
 * list matches both that table and the entries on disk.
 */
export const CONTENTS_ORDER = [
  "baba-yaga",
  "zmey-gorynych",
  "leshy",
  "poludnitsa",
  "bannik",
  "drekavac",
  "domovoi",
  "rusalka",
  "vampir",
  "vodyanoi",
] as const;
