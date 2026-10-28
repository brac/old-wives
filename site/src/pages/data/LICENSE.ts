import type { APIRoute } from "astro";
// The official CC BY 4.0 legal code, fetched once from
// https://creativecommons.org/licenses/by/4.0/legalcode.txt
import text from "../../assets/cc-by-4.0.txt?raw";

export const GET: APIRoute = () => new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
