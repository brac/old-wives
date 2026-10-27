// Usage: npm run validate -- <dir|file> --stage draft|verified   (entries)
//        npm run validate -- <dir|file> --log                      (verify logs)
// --stage is required for entries: a forgotten flag must not silently skip the verified-stage rules.
// Prints one line per issue, then `N valid, M invalid, W warnings`. Exits 1 if any file is invalid.
import { statSync } from "node:fs";
import { summarize, validateDir, validateFile, type Report, type Stage } from "./validate.js";

function usage(message: string): never {
  console.error(message);
  console.error("usage: npm run validate -- <dir|file> --stage draft|verified");
  console.error("       npm run validate -- <dir|file> --log");
  process.exit(2);
}

const args = process.argv.slice(2);
let target: string | undefined;
let stage: Stage | undefined;
let log = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--log") {
    log = true;
  } else if (arg === "--stage") {
    const value = args[++i];
    if (value !== "draft" && value !== "verified") usage(`--stage must be draft or verified, got ${String(value)}`);
    stage = value;
  } else if (arg.startsWith("--")) {
    usage(`unknown option ${arg}`);
  } else if (target === undefined) {
    target = arg;
  } else {
    usage(`unexpected argument ${arg}`);
  }
}

if (target === undefined) usage("missing <dir|file>");
if (!log && stage === undefined) usage("missing --stage (required for entries)");
// Verify logs have no stage; the value is unused by validateLog.
const effectiveStage: Stage = stage ?? "verified";

let report: Report;
try {
  report = statSync(target).isDirectory()
    ? validateDir(target, { stage: effectiveStage, log })
    : summarize([validateFile(target, { stage: effectiveStage, log })]);
} catch (err) {
  usage((err as Error).message);
}

for (const { file, issues } of report.files) {
  for (const issue of issues) {
    console.log(`${file}: ${issue.severity} [${issue.rule}] ${issue.path}: ${issue.message}`);
  }
}
console.log(`${report.valid} valid, ${report.invalid} invalid, ${report.warnings} warnings`);
process.exit(report.invalid > 0 ? 1 : 0);
