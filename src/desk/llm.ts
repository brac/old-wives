// Note-to-edit and the optional Whisper path for the review desk (plan phase-4, 4c).
//
// Endpoint and model are exact-pinned. Endpoint read from fal's OpenAPI schema on 2026-10-28:
//   https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=openrouter/router
// Input: prompt, model (required), system_prompt, max_tokens, temperature. Output: output,
// usage.cost (USD, charged by token usage). Terms: https://fal.ai/legal/terms-of-service
// (the model page, https://fal.ai/models/openrouter/router, names no separate licence).

export const NOTE_ENDPOINT = "openrouter/router";
export const NOTE_MODEL = "google/gemini-2.5-flash";
export const WHISPER_ENDPOINT = "fal-ai/whisper";

/** Lane and desk cap on note-to-edit spend, summed from the queue file's call log. */
export const NOTE_SPEND_CAP_USD = 0.5;

/** The fixed instruction (plan 4c, "Note to edit"). */
export const NOTE_INSTRUCTION = [
  "You edit a short visual description of a folklore creature for an illustrator.",
  "Rewrite the visual text to incorporate the note.",
  "Change nothing the note does not ask for.",
  "Add nothing from outside the note and the current text: no details from folklore sources, no details from your own knowledge of the creature.",
  "Keep the wording of every sentence the note does not touch exactly as it is.",
  "Reply with the revised visual text only, no preamble, no quotes.",
].join(" ");

export function notePrompt(note: string, text: string): string {
  return `CURRENT VISUAL TEXT:\n${text.trim()}\n\nNOTE:\n${note.trim()}`;
}

export interface NoteResult {
  revised: string;
  model: string;
  endpoint: string;
  cost_usd: number;
}

export type FalCall = (endpoint: string, input: Record<string, unknown>) => Promise<{ data: unknown }>;

export async function realFalCall(endpoint: string, input: Record<string, unknown>): Promise<{ data: unknown }> {
  if (!process.env.FAL_KEY) throw new Error("FAL_KEY is not set (the desk loads it from .env)");
  const { fal } = await import("@fal-ai/client");
  try {
    return await fal.subscribe(endpoint, { input, logs: false });
  } catch (err) {
    // fal's ApiError carries the useful detail in `body`; "Bad Request" alone says nothing.
    const e = err as { message?: string; status?: number; body?: unknown };
    throw new Error(`fal ${endpoint} ${e.status ?? ""} ${e.message ?? ""}: ${JSON.stringify(e.body ?? null).slice(0, 300)}`);
  }
}

export async function noteToEdit(note: string, text: string, call: FalCall = realFalCall): Promise<NoteResult> {
  if (!note.trim()) throw new Error("empty note");
  if (!text.trim()) throw new Error("empty visual text");
  const { data } = await call(NOTE_ENDPOINT, {
    model: NOTE_MODEL,
    system_prompt: NOTE_INSTRUCTION,
    prompt: notePrompt(note, text),
    temperature: 0,
    max_tokens: 1200,
  });
  const d = data as { output?: string; error?: string | null; usage?: { cost?: number } | null };
  if (d.error) throw new Error(`note-to-edit model error: ${d.error}`);
  const revised = (d.output ?? "").trim().replace(/^"(.*)"$/s, "$1");
  if (!revised) throw new Error("note-to-edit model returned no text");
  return { revised, model: NOTE_MODEL, endpoint: NOTE_ENDPOINT, cost_usd: Number(d.usage?.cost ?? 0) };
}

/**
 * The fixed instruction for the singular starting text (4c round 6, Ben 2026-10-29). The
 * entry's appearance clauses are research data written about the creature as a kind ("The
 * Vily are pictured as beautiful women"); the desk offers Ben one individual instead. The
 * clauses themselves stay untouched in data/; this rewrite lives only in the desk cache
 * (plates/desk-drafts.json), and its cost counts against NOTE_SPEND_CAP_USD.
 */
export const SINGULAR_INSTRUCTION = [
  "You rewrite a short description of a folklore creature for an illustrator who will draw one individual.",
  'Describe one single creature of this kind, in the singular and the present tense ("She has long hair", not "The Vily have long hair").',
  "Keep every physical detail in the text.",
  "Add nothing that is not in the text: no details from folklore sources, no details from your own knowledge of the creature.",
  'Drop attributions to sources and scholars ("Karadzic says", "according to").',
  "Drop behaviour and belief that cannot be seen in a picture.",
  "Reply with the rewritten text only, no preamble, no quotes.",
].join(" ");

export function singularPrompt(draft: string): string {
  return `DESCRIPTION:\n${draft.trim()}`;
}

export interface SingularResult {
  text: string;
  model: string;
  endpoint: string;
  cost_usd: number;
}

/** Rewrites the joined appearance clauses as one creature, singular and present tense. */
export async function singularize(draft: string, call: FalCall = realFalCall): Promise<SingularResult> {
  if (!draft.trim()) throw new Error("empty agent draft");
  const { data } = await call(NOTE_ENDPOINT, {
    model: NOTE_MODEL,
    system_prompt: SINGULAR_INSTRUCTION,
    prompt: singularPrompt(draft),
    temperature: 0,
    max_tokens: 1200,
  });
  const d = data as { output?: string; error?: string | null; usage?: { cost?: number } | null };
  if (d.error) throw new Error(`singular-draft model error: ${d.error}`);
  const text = (d.output ?? "").trim().replace(/^"(.*)"$/s, "$1");
  if (!text) throw new Error("singular-draft model returned no text");
  return { text, model: NOTE_MODEL, endpoint: NOTE_ENDPOINT, cost_usd: Number(d.usage?.cost ?? 0) };
}

/** Whisper path: audio uploaded to fal storage, transcript returned, audio not kept here. */
export async function transcribe(audio: Blob): Promise<string> {
  if (!process.env.FAL_KEY) throw new Error("FAL_KEY is not set (the desk loads it from .env)");
  const { fal } = await import("@fal-ai/client");
  const url = await fal.storage.upload(audio);
  const { data } = await fal.subscribe(WHISPER_ENDPOINT, { input: { audio_url: url, task: "transcribe", language: "en" }, logs: false });
  return String((data as { text?: string }).text ?? "").trim();
}
