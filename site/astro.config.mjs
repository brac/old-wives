// @ts-check
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { defineConfig } from "astro/config";
import { composeContactSheet } from "./scripts/contact-sheet.ts";

const SITE_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SITE_DIR, "..");
const PLATES_DIR = join(REPO_ROOT, "plates", "slavic");
/** Only the web and thumb sizes ship. The .full.png masters never do. */
const SHIPPED_PLATE = /\.(web|thumb)\.webp$/;

/**
 * Repo code read at build (src/validate, src/corpus, site/src/lib) finds its files
 * through `import.meta.url`. Bundling moves that code into dist chunks, so pin
 * `import.meta.url` to each module's real source location.
 */
function pinImportMetaUrl() {
  const root = REPO_ROOT.replace(/\\/g, "/");
  return {
    name: "old-wives:pin-import-meta-url",
    enforce: /** @type {const} */ ("pre"),
    /** @param {string} code @param {string} id */
    transform(code, id) {
      const file = id.split("?")[0].replace(/\\/g, "/");
      if (!file.startsWith(root + "/") || file.includes("/node_modules/")) return null;
      if (!/\.(ts|js|mjs)$/.test(file) || !code.includes("import.meta.url")) return null;
      return { code: code.replaceAll("import.meta.url", JSON.stringify(pathToFileURL(file).href)), map: null };
    },
  };
}

/** Copies the shipped plate sizes into the build and writes the OG contact sheet. */
function oldWivesAssets() {
  return {
    name: "old-wives:assets",
    hooks: {
      /** @param {{ server: import("vite").ViteDevServer }} opts */
      "astro:server:setup": ({ server }) => {
        server.middlewares.use("/plates/slavic", (req, res, next) => {
          const name = decodeURIComponent((req.url ?? "").split("?")[0].replace(/^\//, ""));
          if (!SHIPPED_PLATE.test(name) || name.includes("/")) return next();
          res.setHeader("Content-Type", "image/webp");
          import("node:fs").then(({ createReadStream }) =>
            createReadStream(join(PLATES_DIR, name)).on("error", () => next()).pipe(res),
          );
        });
      },
      /** @param {{ dir: URL, logger: import("astro").AstroIntegrationLogger }} opts */
      "astro:build:done": async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const platesOut = join(out, "plates", "slavic");
        mkdirSync(platesOut, { recursive: true });
        const shipped = readdirSync(PLATES_DIR).filter((f) => SHIPPED_PLATE.test(f));
        for (const f of shipped) copyFileSync(join(PLATES_DIR, f), join(platesOut, f));
        await composeContactSheet(join(out, "og", "contact-sheet.png"), REPO_ROOT);
        logger.info(`copied ${shipped.length} plate files; wrote og/contact-sheet.png`);
      },
    },
  };
}

export default defineConfig({
  output: "static",
  trailingSlash: "ignore",
  integrations: [oldWivesAssets()],
  vite: { plugins: [pinImportMetaUrl()] },
});
