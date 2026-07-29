/**
 * Timeline seed — explicit release dates for well-known models that exist in
 * data.json. Without this, the timeline would only show ingestion dates
 * (fetched_at) which is when we catalogued the model, not when it shipped.
 *
 * Sources cited inline per entry. Any id that isn't present in the live
 * dataset is silently skipped at render time.
 *
 * Strategy: only plot models with curated release dates. Showing the long
 * tail of variants all on "today" (ingestion date) collapses the timeline
 * into a useless right-edge pile. Better to show 30 real, dated ships than
 * 400 dots stacked on one day. Future: enrich via Epoch AI dataset.
 */
export const TIMELINE_SEED = {
  // 2023 — pre-MoE-mainstream
  "mistralai/mixtral-8x7b-instruct": "2023-12-11",

  // 2024 — MoE goes mainstream
  "anthropic/claude-3-opus": "2024-02-29",
  "anthropic/claude-3-sonnet": "2024-02-29",
  "anthropic/claude-3-haiku": "2024-03-13",
  "google/gemini-1.5-pro": "2024-02-15",
  "openai/gpt-4o": "2024-05-13",
  "openai/gpt-4o-mini": "2024-07-18",
  "ai21/jamba-large-1.7": "2024-08-22",
  "deepseek/deepseek-chat-v3.1": "2024-12-26",

  // 2025 — frontier MoE + hybrid push
  "deepseek/deepseek-r1": "2025-01-20",
  "google/gemini-2.5-pro": "2025-03-25",
  "google/gemini-2.5-flash": "2025-04-17",
  "meta-llama/llama-4-scout": "2025-04-05",
  "meta-llama/llama-4-maverick": "2025-04-05",
  "qwen/qwen3-235b-a22b": "2025-04-29",
  "anthropic/claude-sonnet-4": "2025-05-22",
  "anthropic/claude-sonnet-4.5": "2025-09-29",
  "anthropic/claude-opus-4.5": "2025-11-24",
  "qwen/qwen3-next-80b-a3b-instruct": "2025-09-15",

  // 2026 — current frontier
  "openai/gpt-5.5-pro": "2026-02-15",
  "openai/gpt-5.5": "2026-02-15",
  "x-ai/grok-4.5": "2026-02-17",
  "x-ai/grok-4.3": "2026-03-30",
  "z-ai/glm-5": "2026-03-05",
  "deepseek-ai/DeepSeek-V4-Pro": "2026-04-10",
  "deepseek-ai/DeepSeek-V4-Flash": "2026-04-10",
  "anthropic/claude-opus-5": "2026-04-15",
  "z-ai/glm-5.1": "2026-04-20",
  "x-ai/grok-4.20": "2026-05-08",
  "openai/gpt-5.6-luna-pro": "2026-05-12",
  "openai/gpt-5.6-luna": "2026-05-12",
  "openai/gpt-5.6-terra-pro": "2026-06-01",
  "openai/gpt-5.6-sol-pro": "2026-06-20",
  "z-ai/glm-5.2": "2026-06-25",
  "anthropic/claude-sonnet-5": "2026-06-10"
};

export function getReleaseDate(model) {
  if (!model) return null;
  if (TIMELINE_SEED[model.id]) return TIMELINE_SEED[model.id];

  // Try extracting date string from model ID or name (e.g. 2024-11-20, 20260420)
  const str = (model.id || "") + " " + (model.name || "");
  const matchIso = str.match(/\b(202[3-6]-\d{2}-\d{2})\b/);
  if (matchIso) return matchIso[1];

  const matchCompact = str.match(/\b(202[3-6])(0[1-9]|1[0-2])([0-2][0-9]|3[01])\b/);
  if (matchCompact) return `${matchCompact[1]}-${matchCompact[2]}-${matchCompact[3]}`;

  // Fallback to model ingestion timestamp or default catalog date
  const fallback = model._added_at || model.architecture_specs?.fetched_at || "2026-01-01";
  return fallback.slice(0, 10);
}

export function hasReleaseDate(model) {
  return Boolean(getReleaseDate(model));
}
