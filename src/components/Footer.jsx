import React from "react";

export default function Footer() {
  return (
    <footer>
      <div className="container" style={{ textAlign: "center", paddingBottom: 24 }}>
        <div className="clay clay--sm fx-rise" style={{ padding: "14px 24px", display: "inline-flex", gap: 16, alignItems: "center", justifyContent: "center" }}>
          <span>LLM Atlas · Open source · MIT</span>
        </div>
      </div>
    </footer>
  );
}