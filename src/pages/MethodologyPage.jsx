import React from "react";

export default function MethodologyPage() {
  return (
    <div className="section fx-fade">
      <header className="fx-rise" style={{ marginBottom: 32 }}>
        <h1>Methodology</h1>
        <p style={{ color: "var(--clay-ink-soft)", marginTop: 6, maxWidth: 720 }}>
          Every number on this site links to its source. No composites. No blended scores.
          Here's exactly how each metric is computed.
        </p>
      </header>

      <section className="clay fx-reveal" style={{ padding: 28, marginBottom: 20 }}>
        <h2>Headline score</h2>
        <p style={{ color: "var(--clay-ink-soft)", marginTop: 8, lineHeight: 1.6 }}>
          We pick one benchmark per model to drive comparisons. Default: <strong>Arena ELO</strong> from the
          LMArena mirror (api.wulong.dev). If Arena data isn't available, we fall back to the model's
          highest-scoring benchmark. The score is shown raw — never normalized, never weighted.
        </p>
      </section>

      <section className="clay fx-reveal" style={{ padding: 28, marginBottom: 20 }}>
        <h2>Efficiency score</h2>
        <p style={{ color: "var(--clay-ink-soft)", marginTop: 8, lineHeight: 1.6 }}>
          <code style={{ fontFamily: "var(--font-mono)", padding: "2px 6px", borderRadius: 6, background: "var(--clay-surface)", boxShadow: "var(--clay-shadow-in-sm)" }}>
            efficiency = headline_score ÷ active_params_in_billions
          </code>
        </p>
        <p style={{ color: "var(--clay-ink-soft)", marginTop: 8, lineHeight: 1.6 }}>
          Rewards sparse and efficient designs. A 13B-active MoE at 1200 ELO scores higher than a 405B dense at 1265.
        </p>
      </section>

      <section className="clay fx-reveal" style={{ padding: 28, marginBottom: 20 }}>
        <h2>Value frontier</h2>
        <p style={{ color: "var(--clay-ink-soft)", marginTop: 8, lineHeight: 1.6 }}>
          A model is on the frontier if no other model beats it on both quality <em>and</em> cost.
          We compute blended cost as <code style={{ fontFamily: "var(--font-mono)" }}>0.25 × input + 0.75 × output</code>,
          reflecting the fact that generation tokens dominate real workloads. Frontier membership is recomputed
          whenever data changes.
        </p>
      </section>

      <section className="clay fx-reveal" style={{ padding: 28, marginBottom: 20 }}>
        <h2>Sources</h2>
        <ul style={{ color: "var(--clay-ink-soft)", lineHeight: 1.8, paddingLeft: 20 }}>
          <li><a href="https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard" target="_blank" rel="noreferrer" style={{ color: "var(--clay-accent)" }}>HF Open LLM Leaderboard</a> — IFEval, BBH, MATH, GPQA, MUSR, MMLU-Pro</li>
          <li><a href="https://lmarena.ai" target="_blank" rel="noreferrer" style={{ color: "var(--clay-accent)" }}>LMArena</a> (via sanctioned mirror) — Arena ELO</li>
          <li><a href="https://openrouter.ai" target="_blank" rel="noreferrer" style={{ color: "var(--clay-accent)" }}>OpenRouter</a> — pricing, context window, provider list</li>
          <li>Model cards / arXiv — architecture confirmation for open-weight models</li>
        </ul>
        <p style={{ color: "var(--clay-ink-faint)", marginTop: 12, fontSize: "0.9rem" }}>
          Per TRD §7: no scraping of sites that disallow it. All data comes through official APIs or sanctioned mirrors.
        </p>
      </section>

      <section className="clay fx-reveal" style={{ padding: 28, marginBottom: 20 }}>
        <h2>Two flavors of "incomplete"</h2>
        <p style={{ color: "var(--clay-ink-soft)", marginTop: 8, lineHeight: 1.6 }}>
          We never show a blank field. We distinguish two cases per FR-9:
        </p>
        <ul style={{ color: "var(--clay-ink-soft)", lineHeight: 1.8, paddingLeft: 20 }}>
          <li><strong style={{ color: "var(--clay-accent)" }}>Benchmarks pending</strong> — open-weight model, data will arrive as Arena/HF-leaderboard votes accumulate.</li>
          <li><strong>Architecture not publicly disclosed</strong> — closed model, specs will never be populated by design (we do not fill these from leaks).</li>
        </ul>
      </section>
    </div>
  );
}