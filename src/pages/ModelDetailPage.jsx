import React, { useContext, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { DataContext } from "../context/DataContext";
import { useRevealLive } from "../hooks/useReveal";
import ArchitecturePanel from "../components/ArchitecturePanel";
import BenchmarksTable from "../components/BenchmarksTable";
import PricingCard from "../components/PricingCard";
import { StatusChip, FamilyChip, DisclosureChip } from "../components/ModelCard";
import ModelIcon from "../components/ModelIcon";
import { efficiencyScore, pickHeadlineBenchmark, blendedCost } from "../lib/format";
import getDiagramComponent from "../architectures/DiagramRegistry";
import "./ModelDetailPage.css";

export default function ModelDetailPage() {
  const { modelId } = useParams();
  const { findModel } = useContext(DataContext);
  useRevealLive([modelId]);

  const model = useMemo(() => {
    const decoded = decodeURIComponent(modelId || "");
    return findModel(decoded);
  }, [findModel, modelId]);

  if (!model) {
    return (
      <div className="section">
        <div className="clay clay--lg" style={{ padding: 32, textAlign: "center" }}>
          <h2>Model not found</h2>
          <Link to="/" className="btn btn--accent" style={{ marginTop: 16 }}>← Back home</Link>
        </div>
      </div>
    );
  }

  const eff = efficiencyScore(model);
  const quality = pickHeadlineBenchmark(model.benchmarks || []);
  const cost = blendedCost(model);

  return (
    <div className="section fx-fade model-detail">
      <nav aria-label="breadcrumb" className="crumbs">
        <Link to="/" className="crumbs__link">Home</Link>
        <span className="crumbs__sep">›</span>
        <Link to={`/company/${model.companyKey}`} className="crumbs__link">{model.companyName}</Link>
        <span className="crumbs__sep">›</span>
        <span className="crumbs__current">{model.name}</span>
      </nav>

      <header className="model-detail__header fx-rise" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <ModelIcon model={model} size={64} />
        <div>
          <div className="model-detail__chips">
            <StatusChip status={model.status} />
            <FamilyChip family={model.family} />
            <DisclosureChip d={model.architecture_specs?.disclosure} />
          </div>
          <h1 style={{ marginTop: 6, marginBottom: 0 }}>{model.name}</h1>
          <p style={{ color: "var(--clay-ink-soft)", marginTop: 4 }}>{model.companyName}</p>
        </div>
      </header>

      {model.why && (
        <div className="model-detail__why clay fx-rise">
          <p>{model.why}</p>
        </div>
      )}

      <div className="model-detail__layout">
        <div className="fx-reveal fx-reveal--left">
          <ArchitecturePanel model={model} />
        </div>

        <aside className="model-detail__sidebar fx-reveal fx-reveal--left">
          <section className="clay clay--sm" style={{ padding: 20 }}>
            <h3>Derived metrics</h3>
            <Metric label="Efficiency score" value={eff != null ? eff.toFixed(3) : "—"} hint="benchmark ÷ active params (B)" />
            <Metric label="Headline score" value={quality != null ? Math.round(quality) : "—"} hint="Arena ELO if available, else best" />
            <Metric label="Blended cost" value={cost != null ? `$${cost.toFixed(3)}/M` : "—"} hint="25% in + 75% out" />
          </section>

          {model.features && Object.keys(model.features).length > 0 && (
            <section className="clay clay--sm" style={{ padding: 20, marginTop: 16 }}>
              <h3>Quick facts</h3>
              <dl className="facts">
                {Object.entries(model.features).slice(0, 8).map(([k, v]) => (
                  <div key={k} className="facts__row">
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </aside>
      </div>

      <section className="fx-reveal">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2>Benchmarks</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--clay-ink-faint)" }}>
            Raw scores · no composites
          </span>
        </header>
        <BenchmarksTable benchmarks={model.benchmarks || []} />
      </section>

      <section className="fx-reveal">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2>Hosted pricing</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--clay-ink-faint)" }}>
            USD per 1M tokens
          </span>
        </header>
        <PricingCard pricing={model.pricing || []} />
      </section>

      <section className="fx-reveal">
        <h2 style={{ marginBottom: 12 }}>Architecture diagram</h2>
        <DiagramSlot model={model} />
      </section>

      {/* Compare CTA */}
      <div className="model-detail__cta fx-pop">
        <div>
          <h3>Put this model side-by-side.</h3>
          <p style={{ color: "var(--clay-ink-soft)", marginTop: 4 }}>
            Compare up to 4 models on architecture, benchmarks and pricing.
          </p>
        </div>
        <Link to={`/compare?ids=${encodeURIComponent(model.id)}`} className="btn btn--accent">
          Open in compare →
        </Link>
      </div>
    </div>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div className="metric">
      <div className="metric__label">{label}</div>
      <div className="metric__value">{value}</div>
      {hint && <div className="metric__hint">{hint}</div>}
    </div>
  );
}

/**
 * DiagramSlot — loads the interactive architecture diagram component
 * from DiagramRegistry for open-weight models. For closed undisclosed models,
 * displays an honest "Architecture undisclosed" notice without contradictory diagrams.
 */
function DiagramSlot({ model }) {
  const [Comp, setComp] = React.useState(null);
  const [tried, setTried] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    getDiagramComponent(model).then((C) => {
      if (cancelled) return;
      if (C) setComp(() => C);
      setTried(true);
    });
    return () => { cancelled = true; };
  }, [model]);

  if (!tried) {
    return <div className="diagram-slot fx-shimmer" style={{ height: 280, borderRadius: 22 }} aria-hidden="true" />;
  }

  if (!Comp) {
    return (
      <div className="clay clay--inset" style={{ padding: 28, textAlign: "center", color: "var(--clay-ink-soft)" }}>
        <p>Interactive architecture diagram for this model is pending mapping.</p>
      </div>
    );
  }

  return (
    <div className="clay" style={{ padding: 16, overflow: "hidden" }}>
      <Comp />
    </div>
  );
}