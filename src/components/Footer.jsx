import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="clay clay--sm fx-rise" style={{ padding: "20px 24px", display: "inline-flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          <span>LLM Atlas · Open source · MIT</span>
          <span style={{ opacity: 0.6 }}>·</span>
          <Link className="nav__link" to="/methodology">Methodology</Link>
          <Link className="nav__link" to="/changelog">Changelog</Link>
          <a className="nav__link" href="https://github.com/Devisri-B/LLM-Architectures" target="_blank" rel="noreferrer">Forked from Devisri-B/LLM-Architectures</a>
        </div>
      </div>
    </footer>
  );
}