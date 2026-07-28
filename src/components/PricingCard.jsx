import React from "react";
import { fmtPrice, fmtDate } from "../lib/format";

export default function PricingCard({ pricing }) {
  if (!pricing || pricing.length === 0) {
    return (
      <div className="bench-empty fx-fade">
        <strong>Pricing not listed.</strong>
        <p style={{ marginTop: 8, color: "var(--clay-ink-faint)", fontSize: "0.9rem" }}>
          No hosted provider currently routes this model through public APIs at our data sources.
        </p>
      </div>
    );
  }
  return (
    <div className="fx-stagger" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {pricing.map((p, i) => (
        <div key={i} className="pricing-card">
          <div className="pricing-card__col">
            <div className="pricing-card__label">Input</div>
            <div className="pricing-card__value">{fmtPrice(p.input_price_per_m)}<span className="pricing-card__unit">/M tok</span></div>
          </div>
          <div className="pricing-card__col">
            <div className="pricing-card__label">Output</div>
            <div className="pricing-card__value">{fmtPrice(p.output_price_per_m)}<span className="pricing-card__unit">/M tok</span></div>
          </div>
          <div className="pricing-card__col">
            <div className="pricing-card__label">Provider</div>
            <div className="pricing-card__value" style={{ fontSize: "1rem", fontFamily: "var(--font-sans)", textTransform: "capitalize" }}>
              {p.provider}
            </div>
          </div>
          <div className="pricing-card__col">
            <div className="pricing-card__label">Fetched</div>
            <div className="pricing-card__value" style={{ fontSize: "0.95rem", fontFamily: "var(--font-sans)", fontWeight: 600, color: "var(--clay-ink-soft)" }}>
              {fmtDate(p.fetched_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}