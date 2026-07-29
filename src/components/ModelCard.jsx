import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { fmtParams, fmtContext, fmtPrice, familyLabel, disclosureLabel } from "../lib/format";
import "./ModelCard.css";

const STATUS_MAP = {
  complete: "complete",
  enriched: "enriched",
  auto_added: "auto",
  manual: "auto"
};

const FAMILY_COLOR = {
  dense: "accent",
  moe: "mint",
  hybrid_attention_ssm: "peach",
  looped: "warn",
  multimodal: "accent"
};

export function StatusChip({ status }) {
  const k = STATUS_MAP[status] || "auto";
  return <span className={`status-chip status-chip--${k}`}>{status || "pending"}</span>;
}

export function FamilyChip({ family }) {
  const c = FAMILY_COLOR[family] || "accent";
  return <span className={`chip chip--${c}`}>{familyLabel(family)}</span>;
}

export function DisclosureChip({ d }) {
  return <span className="chip chip--closed">{disclosureLabel(d)}</span>;
}

export default function ModelCard({ model, onClick }) {
  const params = model.architecture_specs?.params_active;
  const ctx = model.architecture_specs?.context_window;
  const price = model.pricing?.[0];
  const Wrapper = onClick ? "button" : Link;
  const wrapperProps = onClick
    ? { type: "button", onClick }
    : { to: `/model/${encodeURIComponent(model.id)}` };

  return (
    <Wrapper className="model-card" {...wrapperProps}>
      <div className="model-card__head">
        <div className="model-card__logo" aria-hidden="true"><Logo size={48} /></div>
        <StatusChip status={model.status} />
      </div>

      <div>
        <h3 className="model-card__title">{model.name}</h3>
        <div className="model-card__org">{model.companyName}</div>
      </div>

      <div className="model-card__meta">
        <FamilyChip family={model.family} />
        {params != null && <span className="chip">{fmtParams(params)} active</span>}
        {ctx != null && <span className="chip">{fmtContext(ctx)} ctx</span>}
        {model.architecture_specs?.num_loops && (
          <span className="chip chip--warn">×{model.architecture_specs.num_loops} loops</span>
        )}
      </div>

      {model.why && <p className="model-card__why">{model.why}</p>}

      {price && (
        <div className="model-card__price">
          from <strong>{fmtPrice(price.input_price_per_m)}</strong>/M in
        </div>
      )}
    </Wrapper>
  );
}