import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DataContext } from "../context/DataContext";
import { useRevealLive } from "../hooks/useReveal";
import { fmtParams, fmtContext, fmtPrice, familyLabel, efficiencyScore, pickHeadlineBenchmark, blendedCost, valueFrontier } from "../lib/format";
import "./ComparePage.css";

const MAX_SLOTS = 4;

export default function ComparePage() {
  const { allModels } = useContext(DataContext);
  const [params, setParams] = useSearchParams();
  const [ids, setIds] = useState(() => params.get("ids")?.split(",").filter(Boolean) ?? []);

  useEffect(() => {
    const next = params.get("ids")?.split(",").filter(Boolean) ?? [];
    setIds(next);
  }, [params]);

  useRevealLive([ids.join(",")]);

  const selected = useMemo(
    () => ids.map((id) => allModels.find((m) => m.id === id)).filter(Boolean),
    [ids, allModels]
  );

  const frontier = useMemo(() => valueFrontier(allModels), [allModels]);

  const updateIds = (next) => {
    setIds(next);
    if (next.length) setParams({ ids: next.join(",") }, { replace: true });
    else setParams({}, { replace: true });
  };

  const toggle = (id) => {
    if (ids.includes(id)) {
      updateIds(ids.filter((x) => x !== id));
    } else if (ids.length < MAX_SLOTS) {
      updateIds([...ids, id]);
    }
  };

  const removeAt = (idx) => {
    const next = ids.filter((_, i) => i !== idx);
    updateIds(next);
  };

  return (
    <div className="section fx-fade compare-page">
      <header className="fx-rise" style={{ marginBottom: 24 }}>
        <h1>Compare models</h1>
        <p style={{ color: "var(--clay-ink-soft)", marginTop: 6, maxWidth: 640 }}>
          Pick up to {MAX_SLOTS} models. We render architecture, benchmarks and pricing side by side — no composites, no blending.
        </p>
      </header>

      {selected.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="clay clay--lg fx-rise" style={{ padding: 20, marginBottom: 32 }}>
          <div className="compare-slot-grid">
            {Array.from({ length: MAX_SLOTS }).map((_, i) => {
              const m = selected[i];
              if (m) {
                return (
                  <div key={m.id} className="compare-slot compare-slot--filled">
                    <button className="compare-slot__remove" onClick={() => removeAt(i)} aria-label={`Remove ${m.name}`}>×</button>
                    <div className="compare-slot__title">{m.name}</div>
                    <div className="compare-slot__org">{m.companyName}</div>
                    {frontier.has(m.id) && (
                      <span className="chip chip--ok" style={{ marginTop: 8 }}>Value frontier</span>
                    )}
                  </div>
                );
              }
              return (
                <div key={`empty-${i}`} className="compare-slot compare-slot--empty">
                  <span>Empty slot</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <CompareTable models={selected} frontier={frontier} />
      )}

      <section style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 16 }}>Pick models</h2>
        <ModelPickerGrid
          allModels={allModels}
          selectedIds={ids}
          onToggle={toggle}
          disabled={ids.length >= MAX_SLOTS && !ids.length}
        />
      </section>
    </div>
  );
}

function CompareTable({ models, frontier }) {
  return (
    <div className="clay" style={{ padding: 8, overflow: "auto" }}>
      <table className="compare-table">
        <thead>
          <tr>
            <th></th>
            {models.map((m) => (
              <th key={m.id}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span className="model-name">{m.name}</span>
                  <span style={{ fontWeight: 400, color: "var(--clay-ink-faint)", fontSize: "0.8rem" }}>{m.companyName}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="row-label"><td>Architecture</td>{models.map(() => <td key={Math.random()}></td>)}</tr>
          <tr>
            <td>Family</td>
            {models.map((m) => <td key={m.id}>{familyLabel(m.family)}</td>)}
          </tr>
          <tr>
            <td>Total params</td>
            {models.map((m) => <td key={m.id}>{fmtParams(m.architecture_specs?.params_total)}</td>)}
          </tr>
          <tr>
            <td>Active params</td>
            {models.map((m) => <td key={m.id}>{fmtParams(m.architecture_specs?.params_active)}</td>)}
          </tr>
          <tr>
            <td>Attention</td>
            {models.map((m) => <td key={m.id}>{m.architecture_specs?.attention_type ?? "—"}</td>)}
          </tr>
          <tr>
            <td>Context window</td>
            {models.map((m) => <td key={m.id}>{fmtContext(m.architecture_specs?.context_window)}</td>)}
          </tr>
          <tr>
            <td>License</td>
            {models.map((m) => <td key={m.id} style={{ fontSize: "0.85rem", color: "var(--clay-ink-soft)" }}>{m.architecture_specs?.license ?? "—"}</td>)}
          </tr>

          <tr className="row-label"><td>Derived metrics</td>{models.map(() => <td key={Math.random()}></td>)}</tr>
          <tr>
            <td>Efficiency score</td>
            {models.map((m) => {
              const e = efficiencyScore(m);
              return <td key={m.id} style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{e != null ? e.toFixed(3) : "—"}</td>;
            })}
          </tr>
          <tr>
            <td>Headline score</td>
            {models.map((m) => {
              const h = pickHeadlineBenchmark(m.benchmarks || []);
              return <td key={m.id} style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{h != null ? Math.round(h) : "—"}</td>;
            })}
          </tr>
          <tr>
            <td>On value frontier?</td>
            {models.map((m) => (
              <td key={m.id}>
                {frontier.has(m.id)
                  ? <span className="chip chip--ok">yes</span>
                  : <span className="chip">no</span>}
              </td>
            ))}
          </tr>

          <tr className="row-label"><td>Pricing (USD / 1M tokens)</td>{models.map(() => <td key={Math.random()}></td>)}</tr>
          <tr>
            <td>Input</td>
            {models.map((m) => <td key={m.id} style={{ fontFamily: "var(--font-mono)" }}>{m.pricing?.[0] ? fmtPrice(m.pricing[0].input_price_per_m) : "—"}</td>)}
          </tr>
          <tr>
            <td>Output</td>
            {models.map((m) => <td key={m.id} style={{ fontFamily: "var(--font-mono)" }}>{m.pricing?.[0] ? fmtPrice(m.pricing[0].output_price_per_m) : "—"}</td>)}
          </tr>
          <tr>
            <td>Blended (25/75)</td>
            {models.map((m) => {
              const c = blendedCost(m);
              return <td key={m.id} style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{c != null ? `$${c.toFixed(3)}` : "—"}</td>;
            })}
          </tr>

          <tr className="row-label"><td>Benchmarks (raw)</td>{models.map(() => <td key={Math.random()}></td>)}</tr>
          {unionBenchmarks(models).map((bn) => (
            <tr key={bn}>
              <td>{bn}</td>
              {models.map((m) => {
                const b = (m.benchmarks || []).find((x) => x.benchmark_name === bn);
                return (
                  <td key={m.id} style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    {b ? formatScore(b.score, bn) : <span style={{ color: "var(--clay-ink-faint)" }}>—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function unionBenchmarks(models) {
  const set = new Set();
  models.forEach((m) => (m.benchmarks || []).forEach((b) => set.add(b.benchmark_name)));
  return Array.from(set).sort();
}

function formatScore(score, name) {
  if (/arena[-_ ]?elo/i.test(name)) return Math.round(score);
  if (score <= 1) return (score * 100).toFixed(2);
  if (score < 10) return score.toFixed(2);
  return score.toFixed(1);
}

function ModelPickerGrid({ allModels, selectedIds, onToggle, disabled }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return allModels.filter((m) => !ql || m.name.toLowerCase().includes(ql) || m.companyName.toLowerCase().includes(ql));
  }, [allModels, q]);

  return (
    <>
      <div className="filter-ribbon fx-rise" style={{ marginBottom: 20 }}>
        <div className="field filter-ribbon__search">
          <span aria-hidden="true" style={{ color: "var(--clay-ink-faint)" }}>⌕</span>
          <input
            type="search"
            placeholder="Search models to add…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search"
          />
        </div>
      </div>
      <div className="model-grid fx-stagger" role="list">
        {filtered.map((m) => {
          const isSel = selectedIds.includes(m.id);
          const isFull = selectedIds.length >= 4 && !isSel;
          return (
            <button
              key={m.id}
              type="button"
              className={`model-card picker ${isSel ? "is-selected" : ""}`}
              onClick={() => !isFull && onToggle(m.id)}
              disabled={isFull}
              aria-pressed={isSel}
            >
              <div className="model-card__head">
                <div className="model-card__logo" aria-hidden="true">{(m.companyName || "?").slice(0, 1).toUpperCase()}</div>
                {isSel && <span className="chip chip--ok">Selected</span>}
              </div>
              <div>
                <h3 className="model-card__title">{m.name}</h3>
                <div className="model-card__org">{m.companyName}</div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="clay clay--lg fx-rise" style={{ padding: 48, textAlign: "center" }}>
      <div style={{ fontSize: "2.4rem", marginBottom: 12 }} aria-hidden="true">⚖️</div>
      <h3>Pick up to 4 models to compare</h3>
      <p style={{ color: "var(--clay-ink-soft)", marginTop: 8, maxWidth: 480, margin: "8px auto 0" }}>
        Tap a model card below. We'll line up architecture, raw benchmarks and pricing side by side.
      </p>
    </div>
  );
}