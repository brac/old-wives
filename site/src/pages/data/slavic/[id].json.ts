import type { APIRoute, GetStaticPaths } from "astro";
import { getEntryIds, getLoaded } from "../../../lib/entries.ts";

export const getStaticPaths = (() => getEntryIds().map((id) => ({ params: { id } }))) satisfies GetStaticPaths;

/** The entry file exactly as committed in data/entries/. */
export const GET: APIRoute = ({ params }) =>
  new Response(getLoaded(params.id!).raw, { headers: { "Content-Type": "application/json" } });
