/**
 * Pure utilities — no React deps. Kept in /lib per ARCHITECTURE.md §5.
 */

export function fmtParams(n) {
  if (n == null) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export function fmtPrice(n) {
  if (n == null) return "—";
  if (n === 0) return "Free";
  if (n < 1) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(2)}`;
}

export function fmtContext(n) {
  if (n == null) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

export function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Efficiency Score per TRD §5:
 *   benchmark ÷ active params (in billions)
 * Returns null if missing inputs or benchmark family can't be normalized.
 */
export function efficiencyScore(model) {
  const a = model?.architecture_specs?.params_active;
  if (!a) return null;
  const b = pickHeadlineBenchmark(model.benchmarks || []);
  if (b == null) return null;
  return b / (a / 1e9);
}

/**
 * Pick a headline benchmark for value-frontier comparisons:
 *   prefer Arena-ELO (broad), else max non-Arena score normalized to 0-100.
 */
export function pickHeadlineBenchmark(benchmarks) {
  if (!benchmarks?.length) return null;
  const arena = benchmarks.find((b) => /arena[-_ ]?elo/i.test(b.benchmark_name));
  if (arena) return arena.score;
  const max = benchmarks.reduce((m, b) => (b.score > (m?.score ?? -Infinity) ? b : m), null);
  if (!max) return null;
  // Normalize likely 0-1 / 0-100 scores to 0-100 scale heuristically
  return max.score <= 1 ? max.score * 100 : max.score;
}

/**
 * Value-frontier helper: blended cost ($/M tokens, 1:3 input:output weight)
 */
export function blendedCost(model) {
  const p = model?.pricing?.[0];
  if (!p) return null;
  return (p.input_price_per_m * 0.25) + (p.output_price_per_m * 0.75);
}

export function valueFrontier(models) {
  // Pareto-optimal over (cost, -quality). Returns Set of model ids on the frontier.
  const pts = models
    .map((m) => ({ id: m.id, cost: blendedCost(m), quality: pickHeadlineBenchmark(m.benchmarks || []) }))
    .filter((p) => p.cost != null && p.quality != null);

  const frontier = new Set();
  for (const p of pts) {
    let dominated = false;
    for (const q of pts) {
      if (q === p) continue;
      if (q.cost <= p.cost && q.quality >= p.quality && (q.cost < p.cost || q.quality > p.quality)) {
        dominated = true;
        break;
      }
    }
    if (!dominated) frontier.add(p.id);
  }
  return frontier;
}

export function familyLabel(f) {
  return {
    dense: "Dense",
    moe: "MoE",
    hybrid_attention_ssm: "Hybrid (SSM+Attn)",
    looped: "Looped",
    multimodal: "Multimodal"
  }[f] || f;
}

export function disclosureLabel(d) {
  return {
    open_weight: "Open weights",
    closed_undisclosed: "Architecture undisclosed",
    partial: "Partial disclosure"
  }[d] || d;
}