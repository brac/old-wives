// @ts-check
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { defineConfig } from "astro/config";
import { composeContactSheet } from "./scripts/contact-sheet.ts";
import { CONTENTS_ORDER } from "./src/lib/contents.ts";
import { SITE_URL } from "./src/lib/site.ts";

const SITE_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SITE_DIR, "..");
const PLATES_DIR = join(REPO_ROOT, "plates", "slavic");
/** Only the web and thumb sizes ship. The .full.png masters never do. */
const SHIPPED_PLATE = /\.(web|thumb)\.webp$/;
/**
 * Only published entries' plates ship. The build fails unless every id in CONTENTS_ORDER is
 * published (site/src/lib/entries.ts), so its ids are exactly the published ones.
 */
const PUBLISHED = new Set(/** @type {readonly string[]} */ (CONTENTS_ORDER));
/** @param {string} f */
const shipsPlate = (f) => SHIPPED_PLATE.test(f) && PUBLISHED.has(f.replace(SHIPPED_PLATE, ""));

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
          if (!shipsPlate(name) || name.includes("/")) return next();
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
        const shipped = readdirSync(PLATES_DIR).filter(shipsPlate);
        for (const f of shipped) copyFileSync(join(PLATES_DIR, f), join(platesOut, f));
        await composeContactSheet(join(out, "og", "contact-sheet.png"), REPO_ROOT);
        logger.info(`copied ${shipped.length} plate files; wrote og/contact-sheet.png`);
      },
    },
  };
}

/**
 * The review desk (plan phase-4, 4c): the /_desk page and its local API, in `astro dev`
 * only. The route is injected and the API mounted only when the command is "dev", so a
 * build never contains either; site/test/desk-absent.test.ts checks dist/.
 */
function reviewDesk() {
  return {
    name: "old-wives:review-desk",
    hooks: {
      /** @param {{ command: string, injectRoute: (r: { pattern: string, entrypoint: string, prerender?: boolean }) => void }} opts */
      "astro:config:setup": ({ command, injectRoute }) => {
        if (command !== "dev") return;
        injectRoute({ pattern: "/_desk", entrypoint: "./src/desk/Desk.astro" });
      },
      /** @param {{ server: import("vite").ViteDevServer, logger: import("astro").AstroIntegrationLogger }} opts */
      "astro:server:setup": async ({ server, logger }) => {
        const envFile = join(REPO_ROOT, ".env");
        if (!process.env.FAL_KEY && existsSync(envFile)) process.loadEnvFile(envFile);
        const mod = await server.ssrLoadModule(join(REPO_ROOT, "src", "desk", "api.ts"));
        const api = mod.createDeskApi({ root: REPO_ROOT, dryRun: process.env.DESK_DRY_RUN === "1" });
        server.middlewares.use("/_desk/api", (req, res, next) => void api(req, res, next));
        logger.info(`review desk at /_desk/${process.env.DESK_DRY_RUN === "1" ? " (redraws are dry runs)" : ""}`);
      },
    },
  };
}

export default defineConfig({
  site: SITE_URL,
  output: "static",
  trailingSlash: "ignore",
  integrations: [oldWivesAssets(), reviewDesk()],
  vite: { plugins: [pinImportMetaUrl()] },
});
