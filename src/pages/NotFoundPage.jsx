import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="section fx-fade">
      <div className="clay clay--lg fx-pop" style={{ padding: 48, textAlign: "center", maxWidth: 540, margin: "60px auto" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: 16 }} aria-hidden="true">🌌</div>
        <h2>Lost in the Latent Space</h2>
        <p style={{ color: "var(--clay-ink-soft)", marginTop: 12, lineHeight: 1.6, fontSize: "1.05rem" }}>
          This LLM did not come into existence yet... or it is hiding from us in the weight matrices.
        </p>
        <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/" className="btn btn--accent">Return to Atlas</Link>
          <Link to="/compare" className="btn btn--ghost">Compare Models</Link>
        </div>
      </div>
    </div>
  );
}