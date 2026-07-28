import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="section fx-fade">
      <div className="clay clay--lg fx-pop" style={{ padding: 48, textAlign: "center", maxWidth: 520, margin: "60px auto" }}>
        <div style={{ fontSize: "3rem", marginBottom: 12 }} aria-hidden="true">🧭</div>
        <h2>Lost in the atlas</h2>
        <p style={{ color: "var(--clay-ink-soft)", marginTop: 8 }}>
          We couldn't find that page. Try the home grid or jump to compare.
        </p>
        <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/" className="btn btn--accent">Home</Link>
          <Link to="/compare" className="btn btn--ghost">Compare models</Link>
        </div>
      </div>
    </div>
  );
}