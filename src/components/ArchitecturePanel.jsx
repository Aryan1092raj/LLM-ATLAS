import React from "react";
import { fmtParams, fmtContext, fmtDate, familyLabel, disclosureLabel } from "../lib/format";

export default function ArchitecturePanel({ model }) {
  const a = model.architecture_specs || {};
  const closed = a.disclosure === "closed_undisclosed";

  return (
    <section className="arch-panel fx-rise" aria-label="Architecture">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--clay-ink-faint)", fontWeight: 700 }}>
            Architecture
          </div>
          <h3 style={{ marginTop: 6 }}>{familyLabel(model.family)}</h3>
        </div>
        <span className={`status-chip ${closed ? "status-chip--closed" : "status-chip--complete"}`}>
          {disclosureLabel(a.disclosure)}
        </span>
      </header>

      {closed ? (
        <div className="arch-disclosure-banner">
          <div className="arch-disclosure-banner__icon" aria-hidden="true">🔒</div>
          <div>
            <strong>Architecture not publicly disclosed.</strong>{" "}
            <span style={{ color: "var(--clay-ink-faint)" }}>
              Per TRD §5.4.1, we do not populate architecture fields from third-party leaks. Only officially confirmed specs are shown below.
            </span>
          </div>
        </div>
      ) : (
        <div className="arch-grid">
          <Stat label="Total params" value={fmtParams(a.params_total)} />
          <Stat label="Active params" value={fmtParams(a.params_active)} />
          <Stat label="Attention" value={a.attention_type || "—"} />
          <Stat label="Layers" value={a.num_hidden_layers ?? "—"} />
          {a.num_loops != null && a.num_loops > 1 && <Stat label="Loops" value={`×${a.num_loops}`} />}
          <Stat label="Context" value={fmtContext(a.context_window)} />
          {a.tokenizer_vocab_size != null && (
            <Stat label="Vocab" value={a.tokenizer_vocab_size.toLocaleString()} />
          )}
          <Stat label="License" value={a.license || "—"} small />
        </div>
      )}

      {a.source_url && (
        <div style={{ fontSize: "0.78rem", color: "var(--clay-ink-faint)" }}>
          Source:{" "}
          <a href={a.source_url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline", color: "var(--clay-accent)" }}>
            {shortUrl(a.source_url)}
          </a>{" "}
          · fetched {fmtDate(a.fetched_at)}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, small }) {
  return (
    <div className="arch-stat">
      <div className="arch-stat__label">{label}</div>
      <div className="arch-stat__value" style={small ? { fontSize: "0.85rem", fontFamily: "var(--font-sans)" } : undefined}>
        {value}
      </div>
    </div>
  );
}

function shortUrl(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
}