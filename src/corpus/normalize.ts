// The one normalisation function used for every corpus match (plan decision).
// NFC, lowercase, strip combining marks, fold pre-reform Cyrillic letters,
// drop word-final ъ, collapse whitespace.

const LETTER_MAP: Record<string, string> = {
  "ѣ": "е",
  "і": "и",
  "ѳ": "ф",
  "ѵ": "и",
  "ё": "е",
  "й": "и",
};

const LETTER_RE = new RegExp(`[${Object.keys(LETTER_MAP).join("")}]`, "gu");

export function normalize(input: string): string {
  let s = input.normalize("NFC").toLowerCase();
  s = s.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC");
  s = s.replace(LETTER_RE, (c) => LETTER_MAP[c] ?? c);
  s = s.replace(/ъ(?!\p{L})/gu, "");
  return s.replace(/\s+/gu, " ").trim();
}
