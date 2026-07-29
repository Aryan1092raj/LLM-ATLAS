import React from "react";
import { useRevealLive } from "../hooks/useReveal";
import "./MethodologyPage.css";

export default function MethodologyPage() {
  useRevealLive();
  return (
    <div className="section fx-fade">
      <header className="fx-rise" style={{ marginBottom: 32 }}>
        <h1>Methodology</h1>
        <p style={{ color: "var(--clay-ink-soft)", marginTop: 6, maxWidth: 720 }}>
          Every number on this site links to its source. No composites. No blended scores.
          Here's exactly how each metric is computed, where the data comes from, and
          where we know we have gaps.
        </p>
      </header>

      <Section title="Headline score">
        <p>
          We pick one benchmark per model to drive comparisons. Default: <strong>Arena ELO</strong> from the
          LMArena mirror (api.wulong.dev). If Arena data isn't available, we fall back to the model's
          highest-scoring benchmark. The score is shown raw — never normalized, never weighted.
        </p>
      </Section>

      <Section title="Efficiency score">
        <Code>efficiency = headline_score / active_params_in_billions</Code>
        <p>
          Rewards sparse and efficient designs. A 13B-active MoE at 1200 ELO scores higher than a 405B dense at 1265.
          When <code>params_active</code> is null (closed model, never disclosed), we fall back to
          <code>params_total</code>. The two are equal for dense models.
        </p>
      </Section>

      <Section title="Value frontier">
        <p>
          A model is on the frontier if no other model beats it on both quality <em>and</em> cost.
          We compute blended cost as <Code>0.25 × input + 0.75 × output</Code>, reflecting the fact that
          generation tokens dominate real workloads. Frontier membership is recomputed whenever data changes.
        </p>
        <p>
          A model with no published pricing (most local/open-weight releases) is excluded from frontier
          computation — there's no cost axis to compare on. We surface this with a "no pricing" badge
          on the relevant cards rather than inventing a value.
        </p>
      </Section>

      <Section title="Architecture family">
        <p>
          Every model is tagged with one of five families: <strong>dense</strong>, <strong>moe</strong>,
          {" "}<strong>hybrid_attention_ssm</strong>, <strong>looped</strong>, or <strong>multimodal</strong>.
          The tag is set automatically during enrichment from <code>config.json</code> fields
          (e.g. <code>num_local_experts</code> → MoE, <code>mixer_type</code> → SSM hybrid) and corrected
          manually for cases where the signal is ambiguous. See the <a href="/#/families" style={{ color: "var(--clay-accent)" }}>Families</a> page
          for a plain-English explanation of each.
        </p>
      </Section>

      <Section title="Sources">
        <p style={{ marginTop: 0 }}>Four primary sources, all accessed via official APIs or sanctioned mirrors. We never scrape sites that disallow it.</p>
        <table className="methodology-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>What we take</th>
              <th>Access</th>
              <th>Cadence</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>HF Open LLM Leaderboard</strong></td>
              <td>IFEval, BBH, MATH, GPQA, MUSR, MMLU-Pro</td>
              <td>HF Datasets API</td>
              <td>Daily</td>
            </tr>
            <tr>
              <td><strong>LMArena mirror</strong></td>
              <td>Arena ELO scores</td>
              <td>Sanctioned JSON mirror (api.wulong.dev)</td>
              <td>Daily, best-effort</td>
            </tr>
            <tr>
              <td><strong>OpenRouter</strong></td>
              <td>Pricing ($/M tokens), context window, provider list</td>
              <td>REST API</td>
              <td>Daily</td>
            </tr>
            <tr>
              <td><strong>Epoch AI Notable Models</strong></td>
              <td>Historical compute, release dates (cross-check)</td>
              <td>Public dataset export</td>
              <td>Weekly</td>
            </tr>
            <tr>
              <td><strong>HF Hub <code>config.json</code></strong></td>
              <td>Architecture specs (layers, heads, experts, attention)</td>
              <td>huggingface_hub lib</td>
              <td>On detection, then static</td>
            </tr>
            <tr>
              <td><strong>arXiv / model cards</strong></td>
              <td>Architecture details not in config.json (manual, low-frequency)</td>
              <td>web_fetch on specific paper URLs</td>
              <td>As needed</td>
            </tr>
          </tbody>
        </table>
        <p style={{ color: "var(--clay-ink-faint)", fontSize: "0.85rem", marginTop: 12 }}>
          Explicitly not used: direct scraping of artificialanalysis.ai or lmarena.ai HTML. If the Arena
          mirror disappears, we fall back to manual periodic spot-checks rather than scraping the primary site.
        </p>
      </Section>

      <Section title="Two flavors of &quot;incomplete&quot;">
        <p style={{ marginTop: 0 }}>
          We never show a blank field. We distinguish two cases:
        </p>
        <ul>
          <li>
            <strong style={{ color: "var(--clay-accent)" }}>Benchmarks pending</strong> — open-weight model, data will
            arrive as Arena/HF-leaderboard votes accumulate. Often takes weeks for newly-released models.
          </li>
          <li>
            <strong>Architecture not publicly disclosed</strong> — closed model, specs will never be populated by
            design. We do not fill these from leaks, third-party estimates, or rumor. If a vendor officially
            discloses a partial spec (e.g., a blog post confirms total param count), we record only the confirmed
            fields with the source link.
          </li>
        </ul>
      </Section>

      <Section title="Known gaps (transparent)">
        <ul>
          <li>
            <strong>Latency / throughput:</strong> not currently measured. OpenRouter exposes telemetry
            but we've deferred integrating it; cost-per-token is a stronger efficiency signal for now.
          </li>
          <li>
            <strong>Released-before-2023:</strong> not tracked. The scope cut-off is 2023 onward to keep the
            dataset dense and curated rather than encyclopedic.
          </li>
          <li>
            <strong>Fine-tunes / quantizations:</strong> filtered out of the primary list.
            They're recorded as aliases of the base model where possible, not as separate entries.
          </li>
          <li>
            <strong>Looped / hybrid families are sparse:</strong> only a handful of production releases
            (Jamba, Nanbeige4, Qwen3-Next, Falcon3 Mamba, Llama 4). The Families explainers call this out
            honestly rather than padding with speculative entries.
          </li>
          <li>
            <strong>Closed-model parameter counts:</strong> when a vendor confirms a specific number
            (e.g., "235B total / 22B active" for Qwen3-235B-A22B), we record it; otherwise we leave it
            null. We do not estimate.
          </li>
        </ul>
      </Section>

      <Section title="Update cadence & failure handling">
        <p>
          The pipeline runs daily via GitHub Actions. Any fetcher that fails 3 consecutive runs auto-opens
          an issue. An abnormal new-model spike (3× the trailing 7-day average) opens the same kind of alert
          — usually means the source changed shape, not that 40 models genuinely shipped overnight.
        </p>
        <p>
          When a fetcher fails on a given day, last-good <code>data.json</code> stays live. The site never
          goes down because of upstream problems. <a href="/#/changelog" style={{ color: "var(--clay-accent)" }}>Changelog</a> shows
          the most recent runs and any errors.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="clay fx-reveal" style={{ padding: 28, marginBottom: 20 }}>
      <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: "1.2rem" }}>{title}</h2>
      <div style={{ color: "var(--clay-ink-soft)", lineHeight: 1.65 }}>
        {children}
      </div>
    </section>
  );
}

function Code({ children }) {
  return (
    <code style={{
      fontFamily: "var(--font-mono)",
      padding: "2px 6px",
      borderRadius: 6,
      background: "var(--clay-surface)",
      boxShadow: "var(--clay-shadow-in-sm)",
      fontSize: "0.92em"
    }}>{children}</code>
  );
}
