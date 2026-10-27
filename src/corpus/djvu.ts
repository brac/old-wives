// A small streaming scanner from IA `_djvu.xml` to per-leaf text.
// One <OBJECT> is one leaf (1-based, in document order). <WORD> texts are
// joined with spaces, <LINE>s with newlines. No XML dependency: the format is
// machine-written and flat enough that a tag tokenizer is sufficient.
import { createReadStream } from "node:fs";

export interface Leaf {
  leaf: number;
  text: string;
}

const ENTITIES: Record<string, string> = { quot: '"', amp: "&", lt: "<", gt: ">", apos: "'" };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (m, ent: string) => {
    if (ent.startsWith("#x")) return String.fromCodePoint(parseInt(ent.slice(2), 16));
    if (ent.startsWith("#")) return String.fromCodePoint(parseInt(ent.slice(1), 10));
    return ENTITIES[ent] ?? m;
  });
}

/** Incremental scanner: feed string chunks, then call end(). */
export class DjvuScanner {
  private buf = "";
  private leaves: Leaf[] = [];
  private lines: string[] | null = null;
  private words: string[] | null = null;
  private word: string | null = null;

  feed(chunk: string): void {
    this.buf += chunk;
    let pos = 0;
    for (;;) {
      const lt = this.buf.indexOf("<", pos);
      if (lt < 0) {
        this.text(this.buf.slice(pos));
        pos = this.buf.length;
        break;
      }
      if (lt > pos) this.text(this.buf.slice(pos, lt));
      const gt = this.buf.indexOf(">", lt);
      if (gt < 0) {
        pos = lt; // incomplete tag: keep for the next chunk
        break;
      }
      this.tag(this.buf.slice(lt + 1, gt));
      pos = gt + 1;
    }
    this.buf = this.buf.slice(pos);
  }

  end(): Leaf[] {
    if (this.buf.length > 0) this.text(this.buf);
    this.buf = "";
    return this.leaves;
  }

  private text(s: string): void {
    if (this.word !== null) this.word += s;
  }

  private tag(raw: string): void {
    const closing = raw.startsWith("/");
    const selfClosing = raw.endsWith("/");
    const name = raw.replace(/^\//, "").split(/[\s/]/, 1)[0];
    switch (name) {
      case "OBJECT":
        if (!closing) {
          this.lines = [];
          if (selfClosing) this.closeObject();
        } else this.closeObject();
        break;
      case "LINE":
        if (!closing && !selfClosing) this.words = [];
        else if (closing && this.words !== null) {
          const line = this.words.join(" ");
          if (line.length > 0) this.lines?.push(line);
          this.words = null;
        }
        break;
      case "WORD":
        if (!closing && !selfClosing) this.word = "";
        else if (closing && this.word !== null) {
          const w = decodeEntities(this.word).replace(/\s+/g, " ").trim();
          if (w.length > 0) this.words?.push(w);
          this.word = null;
        }
        break;
      default:
        break;
    }
  }

  private closeObject(): void {
    this.leaves.push({ leaf: this.leaves.length + 1, text: (this.lines ?? []).join("\n") });
    this.lines = null;
  }
}

export function scanDjvuString(xml: string): Leaf[] {
  const s = new DjvuScanner();
  s.feed(xml);
  return s.end();
}

export async function scanDjvuFile(path: string): Promise<Leaf[]> {
  const s = new DjvuScanner();
  const stream = createReadStream(path, { encoding: "utf8", highWaterMark: 1 << 20 });
  for await (const chunk of stream) s.feed(chunk as string);
  return s.end();
}
