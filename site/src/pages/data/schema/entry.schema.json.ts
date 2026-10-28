import type { APIRoute } from "astro";
import { schemaText } from "../../../lib/entries.ts";

export const GET: APIRoute = () => new Response(schemaText(), { headers: { "Content-Type": "application/json" } });
