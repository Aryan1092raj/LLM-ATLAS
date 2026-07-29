import React from "react";
import { fmtParams, familyLabel, disclosureLabel } from "../lib/format";
import "./ComparisonDiagram.css";

/**
 * Generate a topology-style diagram from architecture_specs.
 * Horizontal stack of blocks ordered by data flow. Closed/undisclosed models
 * render as a single dashed "Architecture undisclosed" block — no inventing.
 *
 * Props:
 *   model: object with architecture_specs, family, disclosure
 */
export default function ComparisonDiagram({ model }) {
  const specs = model?.architecture_specs || {};
  const family = model?.family;
  const disclosure = model?.disclosure;

  const blocks = useBlocks(specs, family, disclosure);

  return (
    <figure className="cdf clay clay--md" aria-label={`Architecture diagram for ${model?.name}`}>
      <figcaption className="cdf__caption">
        <span className="cdf__family">{familyLabel(family)}</span>
        <span className="cdf__sep" aria-hidden="true">·</span>
        <span className="cdf__disclosure">{disclosureLabel(disclosure)}</span>
      </figcaption>

      <div className="cdf__diagram">
        {blocks.map((b, i) => (
          <div
            key={i}
            className={`cdf__block cdf__block--${b.tone}`}
            style={{ flex: b.weight }}
            title={b.title}
          >
            <span className="cdf__label">{b.label}</span>
            {b.sub && <span className="cdf__sub">{b.sub}</span>}
          </div>
        ))}
      </div>

      <div className="cdf__meta">
        <div className="cdf__metaItem">
          <div className="cdf__metaKey">Total params</div>
          <div className="cdf__metaVal">{fmtParams(specs.params_total)}</div>
        </div>
        <div className="cdf__metaItem">
          <div className="cdf__metaKey">Active params</div>
          <div className="cdf__metaVal">{fmtParams(specs.params_active)}</div>
        </div>
        <div className="cdf__metaItem">
          <div className="cdf__metaKey">Attention</div>
          <div className="cdf__metaVal">{specs.attention_type || "—"}</div>
        </div>
        <div className="cdf__metaItem">
          <div className="cdf__metaKey">Context window</div>
          <div className="cdf__metaVal">{specs.context_window ? `${(specs.context_window / 1000).toFixed(0)}K` : "—"}</div>
        </div>
      </div>
    </figure>
  );
}

function useBlocks(specs, family, disclosure) {
  if (disclosure === "closed_undisclosed" || (family && isClosedShape(specs))) {
    return [{ label: "Architecture undisclosed", tone: "ghost", weight: 1, title: "No architecture data published" }];
  }

  const blocks = [];
  blocks.push({ label: "Input", tone: "input", weight: 0.6, sub: "tokens" });

  if (family === "moe") {
    blocks.push({ label: "Router", tone: "router", weight: 0.5, sub: "top-k experts" });
    const layers = specs.num_hidden_layers || specs.n_layers;
    blocks.push({
      label: "MoE Blocks",
      tone: "moe",
      weight: 2.6,
      sub: layers ? `${layers} layers` : "decoder",
      title: `${specs.num_local_experts || "?"} experts`
    });
  } else if (family === "hybrid_attention_ssm") {
    blocks.push({ label: "Embed", tone: "embed", weight: 0.5 });
    blocks.push({
      label: "Hybrid Blocks",
      tone: "hybrid",
      weight: 2.6,
      sub: "Attention + SSM",
      title: "Mamba-style SSM mixed with attention"
    });
  } else if (family === "looped") {
    blocks.push({
      label: "Looped Blocks",
      tone: "looped",
      weight: 2.6,
      sub: "shared weights, N passes"
    });
  } else if (family === "multimodal") {
    blocks.push({ label: "Vision Tok.", tone: "input", weight: 0.7, sub: "image" });
    blocks.push({ label: "Cross-Attn Fusion", tone: "fusion", weight: 1.0 });
    blocks.push({
      label: "Decoder",
      tone: "dense",
      weight: 2.0,
      sub: specs.num_hidden_layers ? `${specs.num_hidden_layers} layers` : "transformer"
    });
  } else {
    blocks.push({ label: "Embed", tone: "embed", weight: 0.5 });
    blocks.push({
      label: "Decoder",
      tone: "dense",
      weight: 2.6,
      sub: specs.num_hidden_layers ? `${specs.num_hidden_layers} layers` : "transformer"
    });
  }

  blocks.push({ label: "Output", tone: "output", weight: 0.6, sub: "logits" });
  return blocks;
}

function isClosedShape(specs) {
  return specs.params_total == null && specs.params_active == null && !specs.num_hidden_layers;
}
