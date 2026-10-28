// Word-level diff for the review desk (plan phase-4, 4c "Note to edit").
// Dependency free: a longest-common-subsequence over whitespace-separated tokens.
// Punctuation stays attached to its word, so "staff." -> "staff," is one changed word.

export type DiffOp = { op: "same" | "del" | "add"; text: string };

export function words(s: string): string[] {
  return s.split(/\s+/).filter(Boolean);
}

/** The edit script turning `a` into `b`, adjacent ops of one kind merged. */
export function wordDiff(a: string, b: string): DiffOp[] {
  const x = words(a);
  const y = words(b);
  const n = x.length;
  const m = y.length;
  // lcs[i][j] = length of the LCS of x[i..] and y[j..].
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = x[i] === y[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out: DiffOp[] = [];
  const push = (op: DiffOp["op"], text: string) => {
    const last = out[out.length - 1];
    if (last && last.op === op) last.text += " " + text;
    else out.push({ op, text });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (x[i] === y[j]) {
      push("same", x[i]);
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push("del", x[i++]);
    } else {
      push("add", y[j++]);
    }
  }
  while (i < n) push("del", x[i++]);
  while (j < m) push("add", y[j++]);
  return out;
}

/** Rebuilds the new text from a diff (used to check a diff round-trips). */
export function applyDiff(ops: DiffOp[]): string {
  return ops
    .filter((o) => o.op !== "del")
    .map((o) => o.text)
    .join(" ");
}
