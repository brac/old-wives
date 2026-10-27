// The four bake-off arms (plan phase-2, "Bake-off arms").
//
// Input fields were read from fal's OpenAPI schema for each endpoint on 2026-10-27:
//   https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=<endpoint>
// All four take `prompt`, `seed` (integer or null), `image_size` (an enum or
// {width, height}, each at most 14142), `num_images` and `output_format` (png allowed).
// `negative_prompt` exists on qwen-image, z-image/base and qwen-image-edit-plus, but NOT on
// flux/schnell, so schnell gets the negative tokens inline as "Avoid: ...".
// Only qwen-image-edit-plus takes reference images, as `image_urls` (string[], required).

export type ArmId = "qwen" | "zimage" | "schnell" | "qwen-edit-refs";

export interface Arm {
  id: ArmId;
  endpoint: string;
  /** Native 3:4 portrait size for the model, no upscaling. */
  width: number;
  height: number;
  /** USD per started megapixel of output (and of each reference input, for edit). */
  usdPerMp: number;
  /** Where the rate came from. */
  priceSource: string;
  hasNegativePrompt: boolean;
  takesRefs: boolean;
  /** Licence of the model weights. */
  licence: string;
}

export const ARMS: Record<ArmId, Arm> = {
  qwen: {
    id: "qwen",
    endpoint: "fal-ai/qwen-image",
    width: 1104,
    height: 1472,
    usdPerMp: 0.02,
    priceSource: "fal model page, 2026-10-27: \"$0.02 per megapixel\"",
    hasNegativePrompt: true,
    takesRefs: false,
    licence: "Apache-2.0",
  },
  zimage: {
    id: "zimage",
    endpoint: "fal-ai/z-image/base",
    width: 864,
    height: 1152,
    usdPerMp: 0.01,
    priceSource: "research open-models.md ($0.01/MP); not shown in the fal page HTML, unverified",
    hasNegativePrompt: true,
    takesRefs: false,
    licence: "Apache-2.0",
  },
  schnell: {
    id: "schnell",
    endpoint: "fal-ai/flux/schnell",
    width: 864,
    height: 1152,
    usdPerMp: 0.003,
    priceSource: "fal model page, 2026-10-27: \"$0.003 per megapixel\"",
    hasNegativePrompt: false,
    takesRefs: false,
    licence: "Apache-2.0",
  },
  "qwen-edit-refs": {
    id: "qwen-edit-refs",
    endpoint: "fal-ai/qwen-image-edit-plus",
    width: 1104,
    height: 1472,
    usdPerMp: 0.03,
    priceSource: "research open-models.md ($0.03/MP); not shown in the fal page HTML, unverified",
    hasNegativePrompt: true,
    takesRefs: true,
    licence: "Apache-2.0",
  },
};

export function getArm(id: string): Arm {
  if (!(id in ARMS)) throw new Error(`unknown arm "${id}"; expected one of ${Object.keys(ARMS).join(", ")}`);
  return ARMS[id as ArmId];
}

/**
 * Upper-bound estimate in USD. Megapixels are counted as 1,000,000 pixels and rounded up,
 * which is never below fal's 1024x1024 rounding. For the edit arm each reference is
 * charged as one further megapixel, an assumption made to stay on the safe side.
 */
export function estimateUsd(arm: Arm, refCount = 0): number {
  const outMp = Math.ceil((arm.width * arm.height) / 1_000_000);
  const inMp = arm.takesRefs ? refCount : 0;
  return Math.round((outMp + inMp) * arm.usdPerMp * 10_000) / 10_000;
}

/** Build the endpoint input. Field names follow each endpoint's schema (see top of file). */
export function buildInput(
  arm: Arm,
  p: { prompt: string; negative: string; seed: number; imageUrls?: string[] },
): Record<string, unknown> {
  const input: Record<string, unknown> = {
    prompt: p.prompt,
    seed: p.seed,
    image_size: { width: arm.width, height: arm.height },
    num_images: 1,
    output_format: "png",
  };
  if (arm.hasNegativePrompt) input.negative_prompt = p.negative;
  if (arm.takesRefs) input.image_urls = p.imageUrls ?? [];
  return input;
}
