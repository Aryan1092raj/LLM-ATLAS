import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../context/DataContext";
import { useRevealLive } from "../hooks/useReveal";
import { FAMILY_CONTENT, FAMILY_ORDER } from "../data/familyContent";
import "./FamiliesPage.css";

export default function FamiliesPage() {
  const { allModels } = useContext(DataContext);
  const navigate = useNavigate();

  useRevealLive([allModels.length]);

  const counts = useMemo(() => {
    const byFamily = new Map();
    for (const m of allModels) {
      byFamily.set(m.family, (byFamily.get(m.family) || 0) + 1);
    }
    return byFamily;
  }, [allModels]);

  return (
    <div className="section fx-fade families-page">
      <header className="fx-rise" style={{ marginBottom: 32 }}>
        <h1>Architecture families</h1>
        <p style={{ color: "var(--clay-ink-soft)", marginTop: 6, maxWidth: 720 }}>
          Five families cover essentially every LLM shipping today. Each page below
          explains the architectural choice, why it matters for benchmarks or cost,
          and shows two or three real models that prove it out.
        </p>
      </header>

      <div className="family-grid fx-stagger" role="list">
        {FAMILY_ORDER.map((familyId) => {
          const c = FAMILY_CONTENT[familyId];
          const count = counts.get(familyId) || 0;
          return (
            <button
              key={familyId}
              type="button"
              role="listitem"
              className={`family-card family-card--${familyId} clay clay--lg`}
              onClick={() => navigate(`/family/${familyId}`)}
              aria-label={`Open ${c.title} explainer`}
            >
              <div className="family-card__head">
                <h2 className="family-card__title">{c.title}</h2>
                <span className="chip">{count} models</span>
              </div>
              <p className="family-card__subtitle">{c.subtitle}</p>
              <p className="family-card__summary">{c.summary}</p>
              <div className="family-card__examples">
                {c.signatureModelIds.slice(0, 2).map((id) => (
                  <span key={id} className="family-card__example-pill">{id.split("/").pop()}</span>
                ))}
              </div>
              <span className="family-card__cta">Read explainer →</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
