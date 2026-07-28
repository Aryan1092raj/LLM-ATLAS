import React, { useContext, useMemo, useState } from "react";
import { DataContext } from "../context/DataContext";
import { useRevealLive } from "../hooks/useReveal";
import ModelCard from "../components/ModelCard";
import "./HomePage.css";

const FAMILY_FILTERS = [
  { id: "all", label: "All" },
  { id: "dense", label: "Dense" },
  { id: "moe", label: "MoE" },
  { id: "hybrid_attention_ssm", label: "Hybrid SSM" },
  { id: "looped", label: "Looped" },
  { id: "multimodal", label: "Multimodal" }
];

export default function HomePage() {
  const { allModels } = useContext(DataContext);
  const [q, setQ] = useState("");
  const [family, setFamily] = useState("all");

  useRevealLive([q, family]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return allModels.filter((m) => {
      if (family !== "all" && m.family !== family) return false;
      if (!ql) return true;
      return (
        m.name.toLowerCase().includes(ql) ||
        m.companyName.toLowerCase().includes(ql) ||
        (m.aliases || []).some((a) => a.toLowerCase().includes(ql))
      );
    });
  }, [allModels, q, family]);

  const stats = useMemo(() => {
    const total = allModels.length;
    const open = allModels.filter((m) => m.architecture_specs?.disclosure === "open_weight").length;
    const moe = allModels.filter((m) => m.family === "moe").length;
    const pending = allModels.filter((m) => (m.benchmarks || []).length === 0).length;
    return { total, open, moe, pending };
  }, [allModels]);

  return (
    <div className="fx-fade">
      {/* Hero */}
      <section className="hero">
        <div className="hero__inner">
          <h1>Every LLM, explained honestly.</h1>
          <p className="lead">
            Architecture, benchmarks and cost — side by side, never blended.
            Auto-discovered from public catalogs, sourced down to the row.
          </p>
          <div className="hero__cta">
            <a href="#models" className="btn btn--accent">Browse models ↓</a>
            <a href="/#/methodology" className="btn btn--ghost">How we score →</a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-strip fx-stagger" aria-label="Atlas overview">
        <div className="stats-strip__item">
          <div className="stats-strip__num">{stats.total}</div>
          <div className="stats-strip__label">Models tracked</div>
        </div>
        <div className="stats-strip__item">
          <div className="stats-strip__num">{stats.open}</div>
          <div className="stats-strip__label">Open weights</div>
        </div>
        <div className="stats-strip__item">
          <div className="stats-strip__num">{stats.moe}</div>
          <div className="stats-strip__label">Mixture of experts</div>
        </div>
        <div className="stats-strip__item">
          <div className="stats-strip__num">{stats.pending}</div>
          <div className="stats-strip__label">Benchmarks pending</div>
        </div>
      </section>

      {/* Filter ribbon */}
      <div id="models" className="filter-ribbon fx-rise" style={{ marginTop: 32 }}>
        <div className="field filter-ribbon__search">
          <span aria-hidden="true" style={{ color: "var(--clay-ink-faint)" }}>⌕</span>
          <input
            type="search"
            placeholder="Search by name, vendor, or alias…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search models"
          />
        </div>
        <div className="filter-ribbon__divider" />
        {FAMILY_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`filter-chip ${family === f.id ? "is-active" : ""}`}
            onClick={() => setFamily(f.id)}
            aria-pressed={family === f.id}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="clay clay--lg fx-rise" style={{ marginTop: 32, padding: 32, textAlign: "center" }}>
          <h3>No models match those filters.</h3>
          <p style={{ color: "var(--clay-ink-soft)", marginTop: 8 }}>
            Try clearing the search or selecting "All".
          </p>
        </div>
      ) : (
        <div className="model-grid fx-stagger" role="list">
          {filtered.map((m) => (
            <div key={m.id} role="listitem">
              <ModelCard model={m} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}