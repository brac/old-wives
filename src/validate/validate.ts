import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename as pathBasename, extname, join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import type { ErrorObject, ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

export type Stage = "draft" | "verified";
export type Severity = "error" | "warning";

/** One problem found in one file. `rule` is a JSON Schema keyword or an R-* id. */
export interface Issue {
  rule: string;
  path: string;
  message: string;
  severity: Severity;
}

export interface FileResult {
  file: string;
  issues: Issue[];
}

export interface Report {
  files: FileResult[];
  valid: number;
  invalid: number;
  warnings: number;
}

export interface EntryOptions {
  stage: Stage;
  /** File name without `.json`. When given, R-ID checks `id` against it. */
  basename?: string;
}

export interface LogOptions {
  basename?: string;
}

export interface DirOptions {
  stage: Stage;
  /** Validate verify-log files instead of entries. */
  log?: boolean;
}

/** Same grammar as `$defs/CiteTag` in schema/entry.schema.json. */
export const CITE_TAG = /^[a-z0-9]+:(p\.[0-9ivxlcdm]+|pp\.[0-9ivxlcdm]+-[0-9ivxlcdm]+|s\.v\..+)$/;

const CITE_KEYS = new Set(["cites", "from_cites", "to_cites"]);

function loadSchema(name: string): object {
  const url = new URL(`../../schema/${name}`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as object;
}

let compiled: { entry: ValidateFunction; log: ValidateFunction } | undefined;

function validators(): { entry: ValidateFunction; log: ValidateFunction } {
  if (!compiled) {
    const ajv = new Ajv2020.default({ allErrors: true, strict: true });
    addFormats.default(ajv);
    compiled = {
      entry: ajv.compile(loadSchema("entry.schema.json")),
      log: ajv.compile(loadSchema("verify-log.schema.json")),
    };
  }
  return compiled;
}

function schemaIssues(fn: ValidateFunction, obj: unknown): Issue[] {
  if (fn(obj)) return [];
  const errors: ErrorObject[] = fn.errors ?? [];
  return (
    errors
      // An `if` error only says "must match then"; the failing `then` keyword is reported on its own.
      .filter((e) => e.keyword !== "if")
      .map((e) => ({
        rule: e.keyword,
        path: e.instancePath || "/",
        message: describe(e),
        severity: "error" as const,
      }))
  );
}

function describe(e: ErrorObject): string {
  const params = e.params as Record<string, unknown>;
  if (e.keyword === "unevaluatedProperties" && params.unevaluatedProperty !== undefined) {
    return `${e.message ?? "invalid"}: "${String(params.unevaluatedProperty)}"`;
  }
  if (e.keyword === "enum" && Array.isArray(params.allowedValues)) {
    return `${e.message ?? "invalid"}: ${params.allowedValues.join(", ")}`;
  }
  return e.message ?? "invalid";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pointer(parts: (string | number)[]): string {
  return "/" + parts.map((p) => String(p).replace(/~/g, "~0").replace(/\//g, "~1")).join("/");
}

/** Every string inside a `cites`-like array, with its JSON pointer. */
function collectCites(value: unknown, at: (string | number)[] = []): { tag: string; path: string }[] {
  const out: { tag: string; path: string }[] = [];
  if (Array.isArray(value)) {
    value.forEach((v, i) => out.push(...collectCites(v, [...at, i])));
  } else if (isRecord(value)) {
    for (const [key, v] of Object.entries(value)) {
      if (CITE_KEYS.has(key) && Array.isArray(v)) {
        v.forEach((tag, i) => {
          if (typeof tag === "string") out.push({ tag, path: pointer([...at, key, i]) });
        });
      } else {
        out.push(...collectCites(v, [...at, key]));
      }
    }
  }
  return out;
}

function idIssue(obj: Record<string, unknown>, key: string, basename: string | undefined): Issue[] {
  if (basename === undefined || obj[key] === basename) return [];
  return [
    {
      rule: "R-ID",
      path: `/${key}`,
      message: `${key} "${String(obj[key])}" does not equal the file basename "${basename}"`,
      severity: "error",
    },
  ];
}

/** Schema plus the semantic rules R-PD, R-CITE-SRC, R-ID and R-STAGE. */
export function validateEntry(obj: unknown, opts: EntryOptions): Issue[] {
  const issues = schemaIssues(validators().entry, obj);
  if (!isRecord(obj)) return issues;

  // R-PD: at least one public-domain source.
  const sources = obj.sources;
  if (Array.isArray(sources) && sources.length > 0) {
    if (!sources.some((s) => isRecord(s) && s.public_domain === true)) {
      issues.push({
        rule: "R-PD",
        path: "/sources",
        message: "no source has public_domain: true",
        severity: "error",
      });
    }
  }

  // R-CITE-SRC: every grammatical cite names a source listed in this entry.
  const sourceIds = new Set(
    (Array.isArray(sources) ? sources : [])
      .filter(isRecord)
      .map((s) => s.source_id)
      .filter((id): id is string => typeof id === "string"),
  );
  for (const { tag, path } of collectCites(obj)) {
    if (!CITE_TAG.test(tag)) continue; // grammar is the schema's job
    const sourceId = tag.slice(0, tag.indexOf(":"));
    if (!sourceIds.has(sourceId)) {
      issues.push({
        rule: "R-CITE-SRC",
        path,
        message: `cite "${tag}" names source "${sourceId}", which is not in this entry's sources`,
        severity: "error",
      });
    }
  }

  // R-ID
  issues.push(...idIssue(obj, "id", opts.basename));

  // R-STAGE: draft agents never grade; verified entries must carry a grade.
  if (opts.stage === "draft" && obj.attestation !== null) {
    issues.push({
      rule: "R-STAGE",
      path: "/attestation",
      message: "attestation must be null at stage draft",
      severity: "error",
    });
  } else if (opts.stage === "verified" && (obj.attestation === null || obj.attestation === undefined)) {
    issues.push({
      rule: "R-STAGE",
      path: "/attestation",
      message: "attestation is required at stage verified",
      severity: "error",
    });
  }

  return issues;
}

/** Schema plus R-ID (`entry_id` equals the file basename). */
export function validateLog(obj: unknown, opts: LogOptions = {}): Issue[] {
  const issues = schemaIssues(validators().log, obj);
  if (isRecord(obj)) issues.push(...idIssue(obj, "entry_id", opts.basename));
  return issues;
}

function readJson(file: string): { value?: unknown; issue?: Issue } {
  try {
    return { value: JSON.parse(readFileSync(file, "utf8")) as unknown };
  } catch (err) {
    return {
      issue: { rule: "json", path: "/", message: (err as Error).message, severity: "error" },
    };
  }
}

/** Validate one entry or verify-log file. R-RELATED needs a directory, so it is not checked here. */
export function validateFile(file: string, opts: DirOptions): FileResult {
  const base = pathBasename(file, extname(file));
  const { value, issue } = readJson(file);
  if (issue) return { file, issues: [issue] };
  const issues = opts.log
    ? validateLog(value, { basename: base })
    : validateEntry(value, { stage: opts.stage, basename: base });
  return { file, issues };
}

/**
 * Validate every `*.json` file in a directory. For entries this adds R-RELATED: every
 * `related[].id` must name an entry in the same directory (warning in draft, error in verified).
 */
export function validateDir(dir: string, opts: DirOptions): Report {
  const names = readdirSync(dir)
    .filter((n) => n.endsWith(".json") && statSync(join(dir, n)).isFile())
    .sort();
  const files = names.map((n) => validateFile(join(dir, n), opts));

  if (!opts.log) {
    const ids = new Set(names.map((n) => n.slice(0, -".json".length)));
    for (const result of files) {
      const { value } = readJson(result.file);
      if (!isRecord(value) || !Array.isArray(value.related)) continue;
      value.related.forEach((rel, i) => {
        if (!isRecord(rel) || typeof rel.id !== "string" || ids.has(rel.id)) return;
        result.issues.push({
          rule: "R-RELATED",
          path: pointer(["related", i, "id"]),
          message: `related id "${rel.id}" is not an entry in ${dir}`,
          severity: opts.stage === "verified" ? "error" : "warning",
        });
      });
    }
  }

  return summarize(files);
}

export function summarize(files: FileResult[]): Report {
  let valid = 0;
  let invalid = 0;
  let warnings = 0;
  for (const f of files) {
    if (f.issues.some((i) => i.severity === "error")) invalid++;
    else valid++;
    warnings += f.issues.filter((i) => i.severity === "warning").length;
  }
  return { files, valid, invalid, warnings };
}
