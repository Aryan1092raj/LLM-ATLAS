import React, { useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { DataContext } from "../context/DataContext";
import { useRevealLive } from "../hooks/useReveal";
import ModelCard from "../components/ModelCard";
import ModelIcon from "../components/ModelIcon";

export default function CompanyPage() {
  const { companyKey } = useParams();
  const { companies } = useContext(DataContext);
  useRevealLive([companyKey]);

  const company = companies.find((c) => c.key === companyKey);
  if (!company) {
    return (
      <div className="section">
        <div className="clay clay--lg" style={{ padding: 32, textAlign: "center" }}>
          <h2>Vendor not found</h2>
          <Link to="/" className="btn btn--accent" style={{ marginTop: 16 }}>← Back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section fx-fade">
      <nav aria-label="breadcrumb" style={{ marginBottom: 16, fontSize: "0.85rem", color: "var(--clay-ink-faint)" }}>
        <Link to="/" style={{ color: "var(--clay-accent)" }}>Home</Link> <span>›</span> {company.name}
      </nav>

      <header className="fx-rise" style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <ModelIcon model={company} size={60} />
        <div>
          <h1 style={{ margin: 0 }}>{company.name}</h1>
          <p style={{ color: "var(--clay-ink-soft)", marginTop: 4 }}>
            {company.models.length} model{company.models.length === 1 ? "" : "s"} tracked.
          </p>
        </div>
      </header>

      <div className="model-grid fx-stagger" role="list">
        {company.models.map((m) => (
          <div key={m.id} role="listitem">
            <ModelCard model={{ ...m, companyName: company.name, companyKey: company.key }} />
          </div>
        ))}
      </div>
    </div>
  );
}