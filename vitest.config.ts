import { configDefaults, defineConfig } from "vitest/config";

// site/ has its own suite (npm run site:test), which needs a site build first.
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, "site/**", ".worktrees/**"] },
});
