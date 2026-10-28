import type { APIRoute } from "astro";
import { indexRows } from "../../../lib/entries.ts";

export const GET: APIRoute = () =>
  new Response(JSON.stringify(indexRows(), null, 2) + "\n", { headers: { "Content-Type": "application/json" } });
