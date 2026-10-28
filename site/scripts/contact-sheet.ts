// Composes the ten plate thumbnails, in contents order, into one contact sheet.
//   npm --prefix site run contact-sheet   -> writes docs/contact-sheet.webp (committed asset)
// The build also calls composeContactSheet() to write /og/contact-sheet.png (see astro.config.mjs).
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";
import { CONTENTS_ORDER } from "../src/lib/contents.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DOCS_CONTACT_SHEET = join(REPO_ROOT, "docs", "contact-sheet.webp");

/** OG card size. Two rows of five 3:4 thumbnails on the paper ground. */
export const WIDTH = 1200;
export const HEIGHT = 630;
const GAP = 24;
const COLS = 5;
const ROWS = 2;
const PAPER = { r: 244, g: 241, b: 234, alpha: 1 };

/** Writes the contact sheet to `out`; the format follows the extension (.png or .webp). */
export async function composeContactSheet(out: string, root: string = REPO_ROOT): Promise<void> {
  const cellH = Math.floor((HEIGHT - (ROWS + 1) * GAP) / ROWS);
  const cellW = Math.round((cellH * 3) / 4);
  const left = Math.floor((WIDTH - (COLS * cellW + (COLS - 1) * GAP)) / 2);
  const tiles = await Promise.all(
    CONTENTS_ORDER.map(async (id, i) => ({
      input: await sharp(join(root, "plates", "slavic", `${id}.thumb.webp`))
        .resize(cellW, cellH, { fit: "contain", background: PAPER })
        .toBuffer(),
      left: left + (i % COLS) * (cellW + GAP),
      top: GAP + Math.floor(i / COLS) * (cellH + GAP),
    })),
  );
  mkdirSync(dirname(out), { recursive: true });
  const img = sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: PAPER } }).composite(tiles);
  if (out.endsWith(".png")) await img.png({ compressionLevel: 9 }).toFile(out);
  else await img.webp({ quality: 85 }).toFile(out);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await composeContactSheet(DOCS_CONTACT_SHEET);
  console.log(`wrote ${DOCS_CONTACT_SHEET}`);
}
