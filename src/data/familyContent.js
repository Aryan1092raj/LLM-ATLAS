/**
 * Architecture family explainer content — Phase 4.
 *
 * Each family has:
 *  - id (matches `family` field in data.json)
 *  - title, summary (1 paragraph, plain English)
 *  - whyItMatters (paragraph tying architecture choice to benchmark/cost outcome)
 *  - pros, cons (short lists)
 *  - signatureModels: 2-3 example model ids drawn from data.json. The Families page
 *    filters `allModels` by `family`, but the deep-dive page surfaces these as
 *    the curated reading list. If any signature id is missing from the dataset
 *    we silently skip it rather than 404 — the narrative should not break.
 *
 * Sources for each "why" paragraph are cited inline so this content is auditable.
 */

export const FAMILY_CONTENT = {
  dense: {
    id: "dense",
    title: "Dense transformers",
    subtitle: "Every parameter fires on every token. Simple, predictable, well-understood.",
    summary:
      "A dense model routes every input token through the full set of weights — there's no routing, no skipping, no experts. The transformer block (multi-head or grouped-query attention + MLP) is stacked N times and the whole stack runs for every forward pass. This is the original Transformer recipe and remains the dominant choice for sub-70B-parameter open models.",
    whyItMatters:
      "Dense inference cost is roughly proportional to total params. A 70B dense model needs the same compute whether you're asking it to translate a sentence or summarize a novel, because every weight participates. That predictability is also a ceiling — quality scales with parameter count, and parameter count drives FLOPs linearly, so the cost-to-quality ratio is fixed for a given architecture family. Dense wins on simplicity (single forward graph, easy to compile, easy to serve) and loses on per-token efficiency at the frontier.",
    pros: [
      "Simplest serving story — single forward graph, mature inference engines",
      "Predictable memory + latency — no routing variability between tokens",
      "Well-understood training dynamics, scaling laws, and tooling"
    ],
    cons: [
      "Cost scales with total params, not problem difficulty",
      "Hard to push past ~70B-active on commodity hardware without quantization",
      "Less parameter-efficient than MoE at matched inference budget"
    ],
    signatureModelIds: ["meta-llama/llama-3.1-70b-instruct", "meta-llama/llama-3.1-405b-instruct", "google/gemma-3-27b-it"]
  },

  moe: {
    id: "moe",
    title: "Mixture of Experts (MoE)",
    subtitle: "Many experts, few active per token. Sparse routing for cheap inference at scale.",
    summary:
      "An MoE model replaces the dense MLP block with N parallel expert MLPs and a learned router that picks the top-k (typically 2 or 8 out of 8 to 256) per token. Total parameter count can be huge, but active parameters per token stays small, so per-token FLOPs scale with active params, not total. The result: a 671B-total / 37B-active model can match a much larger dense model on benchmarks while costing roughly like a 37B.",
    whyItMatters:
      "Sparse activation is the single biggest lever in modern LLM cost. The active-params denominator in our Efficiency Score is what makes MoE models dominate that metric — Mixtral 8x7B famously beat Llama 2 70B on most benchmarks at a fraction of the active compute, and DeepSeek-V3 (671B total / 37B active) extended this to the frontier tier. The trade-off is VRAM: all experts must be resident in memory even though only a few fire per token, so MoE shines for hosted inference and is painful for local self-hosting unless you have multiple high-VRAM accelerators.",
    pros: [
      "Best active-params-per-quality ratio on the value frontier",
      "Capacity scales with total params, cost scales with active params — decoupled",
      "Cheap to push total params very high without linear cost growth"
    ],
    cons: [
      "All experts must fit in VRAM — memory cost = dense of the same total",
      "Routing introduces tail-latency and load-balancing variance between requests",
      "Harder to fine-tune on small datasets — router can collapse to a few experts"
    ],
    signatureModelIds: ["mistralai/mixtral-8x7b-instruct", "deepseek/deepseek-chat-v3.1", "qwen/qwen3-235b-a22b"]
  },

  hybrid_attention_ssm: {
    id: "hybrid_attention_ssm",
    title: "Hybrid attention + SSM",
    subtitle: "Attention for recall, state-space models for throughput. Linear-time long context.",
    summary:
      "A hybrid stack interleaves attention layers (exact, quadratic in context length, strong at retrieving specific tokens from far back) with state-space model layers (Mamba-style, linear in context length, strong at long-range summarization). The two compensate for each other's weaknesses — attention is precise but expensive, SSM is cheap but lossy on exact recall. Typical ratios are 1 attention block every 6-8 SSM blocks.",
    whyItMatters:
      "Long-context inference is where hybrid stacks win decisively. A pure-attention model has compute cost proportional to context_length² per token; a pure-SSM model is linear but struggles with verbatim recall (the well-known 'associative recall' weakness Mamba v1 had). Hybrid stacks get the best of both — linear-ish scaling to hundreds of thousands of tokens, plus attention's exact recall where it matters. Jamba was the first production-scale release; Qwen3-Next and others have followed. For any workload that touches 100K+ contexts (long-doc QA, repo-level code, agent traces), hybrid attention lets you keep per-token cost flat instead of quadratically exploding.",
    pros: [
      "Near-linear cost scaling into 100K-1M context windows",
      "Strong on long-context benchmarks (needle-in-haystack, RULER) at a fraction of attention cost",
      "Smaller active memory footprint than dense models at the same context length"
    ],
    cons: [
      "SSM layers are weaker at exact token-level recall than pure attention",
      "Newer paradigm — less mature serving infrastructure than dense/MoE",
      "Recurrent state makes some batching / parallelism patterns harder"
    ],
    signatureModelIds: ["ai21/jamba-large-1.7", "qwen/qwen3-next-80b-a3b-instruct", "meta-llama/llama-4-scout"]
  },

  looped: {
    id: "looped",
    title: "Looped transformers",
    subtitle: "Recycle the same block N times. Parameter sharing for tiny-but-capable models.",
    summary:
      "A looped transformer reuses a single (or a few) transformer blocks multiple times per forward pass instead of stacking N distinct blocks. Each loop iteration refines the hidden state, so depth of computation comes from iteration count, not unique weights. Total unique parameters stay tiny (often <5B) while the effective depth can rival a much larger stack.",
    whyItMatters:
      "Looped designs target the small-model regime where the dense-vs-MoE trade-off is most punishing. At 1-3B unique params, a dense model can't match a 7B+ model's quality, and MoE has routing overhead that doesn't pay off at that scale. Looping the same block adds effective depth without adding parameters — useful for on-device and edge deployment where model footprint dominates. The Nanbeige4 line is the canonical open example; the trade-off is throughput (multiple passes per token) and the fact that the loop depth is a hyperparameter that has to be tuned carefully.",
    pros: [
      "Very small parameter footprint — fits on phones / edge devices",
      "Effective depth decoupled from unique parameter count",
      "Surprisingly competitive at sub-3B size vs larger dense baselines"
    ],
    cons: [
      "Multiple passes per token hurts throughput vs single-pass models at the same size",
      "Loop-depth hyperparameter adds a tuning axis most dense stacks don't have",
      "Limited evidence at the >7B scale — design still mostly confined to small models"
    ],
    signatureModelIds: ["nanbeige/nanbeige4.2-3b"]
  },

  multimodal: {
    id: "multimodal",
    title: "Multimodal models",
    subtitle: "Text plus image, audio, or video. Same transformer backbone, additional input adapters.",
    summary:
      "Multimodal models extend a text transformer with one or more modality adapters — vision encoders (CLIP-style or ViT), audio front-ends, or video tokenizers — that map non-text inputs into the same embedding space as text tokens. The backbone transformer is largely unchanged; the architecture story is about the adapter and how tokens from different modalities are interleaved or fused.",
    whyItMatters:
      "From an efficiency standpoint, multimodal models look like their text-only cousins — the family's MoE/dense/hybrid distinction still drives cost. What they add is a token-budget story: an image at 1024 tokens costs 1024× a text token of compute, and a 1-minute video clip can consume hundreds of thousands of tokens. So context window, modality encoder efficiency, and whether the model does early/late fusion matter as much as the backbone family. The flagship closed models (GPT-4o, Claude 3.5/4, Gemini 2.5) are all multimodal, and most of the cost-of-being-frontier is in the modality encoders and the long contexts they enable.",
    pros: [
      "Single model handles text + vision/audio in one API",
      "Reuses mature text-transformer backbones, so quality tracks text-model frontier",
      "Enables unified agent workflows (read the screen, hear the audio, write the reply)"
    ],
    cons: [
      "Modality tokens are expensive — one image ≈ hundreds of text tokens",
      "Adapter design varies wildly across vendors (no standard)",
      "Closed multimodal models usually have undisclosed modality encoder details"
    ],
    signatureModelIds: ["openai/gpt-4o", "anthropic/claude-3-sonnet", "google/gemini-2.5-pro"]
  }
};

export const FAMILY_ORDER = ["dense", "moe", "hybrid_attention_ssm", "looped", "multimodal"];

export function getFamilyContent(familyId) {
  return FAMILY_CONTENT[familyId] || null;
}

export function getSignatureModels(familyId, allModels) {
  const content = FAMILY_CONTENT[familyId];
  if (!content) return [];
  const byId = new Map(allModels.map((m) => [m.id, m]));
  const hits = [];
  for (const id of content.signatureModelIds) {
    const m = byId.get(id);
    if (m) hits.push(m);
  }
  // If we have fewer than 2 hits from the curated list, top up with any family matches.
  if (hits.length < 2) {
    const seen = new Set(hits.map((m) => m.id));
    for (const m of allModels) {
      if (m.family === familyId && !seen.has(m.id)) {
        hits.push(m);
        if (hits.length >= 3) break;
      }
    }
  }
  return hits.slice(0, 3);
}
