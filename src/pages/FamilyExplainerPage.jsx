import React, { useContext, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { DataContext } from "../context/DataContext";
import { useRevealLive } from "../hooks/useReveal";
import { getFamilyContent, getSignatureModels } from "../data/familyContent";
import {
  fmtParams,
  fmtContext,
  fmtScore,
  pickHeadlineBenchmark,
  familyLabel
} from "../lib/format";
import "./FamiliesPage.css";

export default function FamilyExplainerPage() {
  const { familyId } = useParams();
  const navigate = useNavigate();
  const { allModels } = useContext(DataContext);

  const content = getFamilyContent(familyId);
  const signatureModels = useMemo(
    () => getSignatureModels(familyId, allModels),
    [familyId, allModels]
  );
  const familyModels = useMemo(
    () => allModels.filter((m) => m.family === familyId),
    [allModels, familyId]
  );

  useRevealLive([familyId, signatureModels.length]);

  if (!content) {
    return (
      <div className="section fx-fade family-explainer">
        <button className="family-explainer__back" onClick={() => navigate("/families")}>
          ← All families
        </button>
        <div className="clay clay--lg fx-pop" style={{ padding: 48, textAlign: "center", maxWidth: 540, margin: "40px auto" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: 16 }} aria-hidden="true">🧬</div>
          <h2>Architecture Family Not Found</h2>
          <p style={{ color: "var(--clay-ink-soft)", marginTop: 12, lineHeight: 1.6, fontSize: "1.05rem" }}>
            This architecture family did not come into existence yet... or it is hiding from us in novel research papers.
          </p>
          <button onClick={() => navigate("/families")} className="btn btn--accent" style={{ marginTop: 24 }}>Browse All Families</button>
        </div>
      </div>
    );
  }

  return (
    <div className="section fx-fade family-explainer">
      <button className="family-explainer__back" onClick={() => navigate("/families")}>
        ← All families
      </button>

      <header className="fx-rise">
        <h1>{content.title}</h1>
        <p className="family-explainer__lede">{content.subtitle}</p>
      </header>

      <section className="family-explainer__why fx-reveal">
        <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: "1.1rem" }}>Why this family matters</h2>
        <p style={{ margin: 0, color: "var(--clay-ink-soft)" }}>{content.summary}</p>
        <p style={{ marginTop: 16, marginBottom: 0, color: "var(--clay-ink-soft)" }}>
          {content.whyItMatters}
        </p>
      </section>

      <section className="family-explainer__proscons fx-reveal">
        <div className="family-explainer__list family-explainer__list--pros">
          <h3>Strengths</h3>
          <ul>
            {content.pros.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
        <div className="family-explainer__list family-explainer__list--cons">
          <h3>Trade-offs</h3>
          <ul>
            {content.cons.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      </section>

      <section className="fx-reveal">
        <h2 style={{ marginBottom: 6 }}>Signature models</h2>
        <p style={{ color: "var(--clay-ink-soft)", maxWidth: 640, marginTop: 0 }}>
          Two or three real {familyLabel(familyId)} models from our dataset that illustrate the family in practice.
          {familyModels.length > signatureModels.length && (
            <> {familyModels.length} total {familyLabel(familyId)} models tracked — see <Link to="/" style={{ color: "var(--clay-accent)" }}>the full list</Link>.</>
          )}
        </p>
        <div className="family-explainer__models">
          {signatureModels.map((m) => (
            <FamilyModelCard
              key={m.id}
              model={m}
              onOpen={() => navigate(`/model/${encodeURIComponent(m.id)}`)}
            />
          ))}
          {signatureModels.length === 0 && (
            <div className="clay" style={{ padding: 24, color: "var(--clay-ink-soft)" }}>
              No {familyLabel(familyId)} models in the dataset yet — try the
              {" "}<Link to="/" style={{ color: "var(--clay-accent)" }}>home page</Link> filter.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FamilyModelCard({ model, onOpen }) {
  const headline = pickHeadlineBenchmark(model.benchmarks || []);
  const headlineName = (model.benchmarks || []).find((b) => b.score === headline)?.benchmark_name || "—";
  return (
    <button type="button" className="family-model-card" onClick={onOpen}>
      <h3 className="family-model-card__name">{model.name}</h3>
      <p className="family-model-card__org">{model.companyName}</p>
      <div className="family-model-card__row">
        <span>Total params</span>
        <strong>{fmtParams(model.architecture_specs?.params_total)}</strong>
      </div>
      <div className="family-model-card__row">
        <span>Active params</span>
        <strong>{fmtParams(model.architecture_specs?.params_active)}</strong>
      </div>
      <div className="family-model-card__row">
        <span>Attention</span>
        <strong>{model.architecture_specs?.attention_type ?? "—"}</strong>
      </div>
      <div className="family-model-card__row">
        <span>Context</span>
        <strong>{fmtContext(model.architecture_specs?.context_window)}</strong>
      </div>
      <div className="family-model-card__row">
        <span>{headlineName}</span>
        <strong>{headline != null ? fmtScore(headline, headlineName) : "—"}</strong>
      </div>
    </button>
  );
}
