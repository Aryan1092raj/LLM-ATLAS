/**
 * DiagramRegistry — maps canonical model names to the React Flow diagram
 * components from the forked upstream repo. Anything not registered
 * (or whose import fails) returns null, and the page renders a graceful
 * fallback per TRD NFR-6.
 *
 * Lazy-imported: the upstream fork has ~40 components; we only want the
 * relevant one in the bundle when its model page is visited.
 */

// Map exact model names → upstream file. Only models with confirmed matching
// components are listed; the rest get the graceful "diagram pending" fallback.
const LAZY = {
  "Claude 3 Opus": () => import("./Claude3Opus"),
  "Claude 3 Sonnet": () => import("./Claude3Sonnet"),
  "Claude 3 Haiku": () => import("./Claude3Haiku"),
  "Gemini 1.5 Pro": () => import("./Gemini15Architecture"),
  "Gemini 1.5 Flash": () => import("./Gemini15Architecture"),
  "DeepSeek V3": () => import("./DeepSeek-V3"),
  "DeepSeek R1": () => import("./DeepSeek-R1"),
  "Mixtral 8x7B Instruct": () => import("./Llama"),
  "Qwen 2.5 72B Instruct": () => import("./QwenBaseArchitecture"),
  "Qwen 2.5 7B Instruct": () => import("./QwenBaseArchitecture"),
  "Gemma 2 27B IT": () => import("./GeminiBaseArchitecture"),
  "Falcon3 10B Base": () => import("./Falcon3_10B_BaseArchitecture"),
  "Falcon3 Mamba 7B Base": () => import("./Falcon3_Mamba_7BArchitecture")
};

const cache = new Map();

export default async function getDiagramComponent(name) {
  if (cache.has(name)) return cache.get(name);
  const loader = LAZY[name];
  if (!loader) {
    cache.set(name, null);
    return null;
  }
  try {
    const mod = await loader();
    const comp = mod.default || mod[Object.keys(mod)[0]];
    cache.set(name, comp || null);
    return comp || null;
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Diagram load failed for ${name}:`, e?.message);
    }
    cache.set(name, null);
    return null;
  }
}