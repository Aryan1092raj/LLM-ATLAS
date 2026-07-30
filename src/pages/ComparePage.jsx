import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DataContext } from "../context/DataContext";
import { useRevealLive } from "../hooks/useReveal";
import {
  fmtParams,
  fmtContext,
  fmtPrice,
  familyLabel,
  efficiencyScore,
  pickHeadlineBenchmark,
  blendedCost,
  disclosureLabel,
  fmtScore
} from "../lib/format";
import ModelIcon from "../components/ModelIcon";
import ComparisonDiagram from "../components/ComparisonDiagram";
import BenchmarkRadar from "../components/BenchmarkRadar";
import CostBarChart from "../components/CostBarChart";
import ValueFrontierChart from "../components/ValueFrontierChart";
import EfficiencyScoreCard from "../components/EfficiencyScoreCard";
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

  const efficiencyRanked = useMemo(() => {
    const scored = selected
      .map((m) => ({ m, e: efficiencyScore(m) }))
      .filter((x) => x.e != null)
      .sort((a, b) => b.e - a.e);
    return scored.map((x) => x.m);
  }, [selected]);

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

  const coverage = useMemo(() => {
    const total = allModels.length;
    let benchmarked = 0;
    for (const m of allModels) {
      if ((m.benchmarks || []).length > 0) benchmarked++;
    }
    return { total, benchmarked, pending: total - benchmarked };
  }, [allModels]);

  return (
    <div className="section fx-fade compare-page">
      <header className="fx-rise" style={{ marginBottom: 24 }}>
        <div className="compare-coverage">
          <span className="compare-coverage__chip">
            <strong>{coverage.total}</strong> models
          </span>
          <span className="compare-coverage__chip is-good">
            <strong>{coverage.benchmarked}</strong> benchmarked
          </span>
          <span
            className="compare-coverage__chip is-pending"
            title="Newly-released models often take weeks to accumulate Arena votes and Open LLM Leaderboard data."
          >
            <strong>{coverage.pending}</strong> benchmarks pending
          </span>
        </div>
        <h1 style={{ marginTop: 14 }}>Compare models</h1>
        <p style={{ color: "var(--clay-ink-soft)", marginTop: 6, maxWidth: 640 }}>
          Pick up to {MAX_SLOTS} models. Architecture, raw benchmarks, and pricing side by side — no composites, no blending.
        </p>
      </header>

      {selected.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="clay clay--lg fx-rise compare-slots">
            <div className="compare-slot-grid">
              {Array.from({ length: MAX_SLOTS }).map((_, i) => {
                const m = selected[i];
                if (m) {
                  return (
                    <div key={m.id} className="compare-slot compare-slot--filled">
                      <button className="compare-slot__remove" onClick={() => removeAt(i)} aria-label={`Remove ${m.name}`}>×</button>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <ModelIcon model={m} size={36} />
                        <div>
                          <div className="compare-slot__title">{m.name}</div>
                          <div className="compare-slot__org">{m.companyName}</div>
                        </div>
                      </div>
                      {frontier.has(m.id) && (
                        <span className="chip chip--ok" style={{ marginTop: 4 }}>Value frontier</span>
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

          <section className="compare-section fx-rise" aria-labelledby="arch-head">
            <h2 id="arch-head" className="compare-section__title">Architecture</h2>
            <p className="compare-section__lede">
              Drawn from each model's published specs. Closed / undisclosed models show as a dashed block — no inventing.
            </p>
            <div className="compare-diagrams">
              {selected.map((m) => (
                <ComparisonDiagram
                  key={m.id}
                  model={m}
                />
              ))}
            </div>
          </section>

          <section className="compare-section fx-rise" aria-labelledby="es-head">
            <h2 id="es-head" className="compare-section__title">Efficiency score</h2>
            <p className="compare-section__lede">
              benchmark score ÷ active parameters (in billions). Rewards sparse / efficient designs, not brute-force scale.
            </p>
            <div className="compare-efficiency">
              {efficiencyRanked.length > 0 ? (
                efficiencyRanked.map((m, i) => (
                  <EfficiencyScoreCard
                    key={m.id}
                    model={m}
                    rank={i}
                    total={efficiencyRanked.length}
                  />
                ))
              ) : (
                selected.map((m) => (
                  <EfficiencyScoreCard
                    key={m.id}
                    model={m}
                    rank={0}
                    total={selected.length}
                  />
                ))
              )}
            </div>
          </section>

          <section className="compare-section fx-rise" aria-labelledby="bench-head">
            <h2 id="bench-head" className="compare-section__title">Benchmarks</h2>
            <p className="compare-section__lede">
              Radar of raw benchmark scores. Each axis is normalized to the best score in this selection.
            </p>
            <BenchmarkRadar models={selected} />
          </section>

          <section className="compare-section fx-rise" aria-labelledby="cost-head">
            <h2 id="cost-head" className="compare-section__title">Cost</h2>
            <p className="compare-section__lede">
              USD per 1M tokens, log scale. Blended = 25% input + 75% output. Latency isn't measured yet.
            </p>
            <CostBarChart models={selected} />
          </section>

          <section className="compare-section fx-rise" aria-labelledby="vf-head">
            <h2 id="vf-head" className="compare-section__title">Value frontier</h2>
            <p className="compare-section__lede">
              Pareto set over quality vs. cost. Circled points are undominated — nothing in the selection beats them on both axes.
            </p>
            <ValueFrontierChart models={selected} frontier={frontier} />
          </section>

          <section className="compare-section fx-rise" aria-labelledby="specs-head">
            <h2 id="specs-head" className="compare-section__title">Specs (raw)</h2>
            <p className="compare-section__lede">
              Every published field, no normalization. Numbers come straight from the source.
            </p>
            <CompareTable models={selected} frontier={frontier} />
          </section>
        </>
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
            <td>Disclosure</td>
            {models.map((m) => <td key={m.id}>{disclosureLabel(m.disclosure)}</td>)}
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

          <tr className="row-label"><td>Derived metrics</td>{models.map((m) => <td key={m.id}></td>)}</tr>
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
              const bn = (m.benchmarks || []).find((b) => b.score === h)?.benchmark_name || "";
              return <td key={m.id} style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{h != null ? fmtScore(h, bn) : "—"}</td>;
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

          <tr className="row-label"><td>Pricing (USD / 1M tokens)</td>{models.map((m) => <td key={m.id}></td>)}</tr>
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

          <tr className="row-label"><td>Benchmarks (raw)</td>{models.map((m) => <td key={m.id}></td>)}</tr>
          {unionBenchmarks(models).map((bn) => (
            <tr key={bn}>
              <td>{bn}</td>
              {models.map((m) => {
                const b = (m.benchmarks || []).find((x) => x.benchmark_name === bn);
                return (
                  <td key={m.id} style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    {b ? fmtScore(b.score, bn) : <span style={{ color: "var(--clay-ink-faint)" }}>—</span>}
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

function valueFrontier(models) {
  const pts = models
    .map((m) => ({ id: m.id, cost: blendedCost(m), quality: pickHeadlineBenchmark(m.benchmarks || []) }))
    .filter((p) => p.cost != null && p.quality != null);

  const frontier = new Set();
  for (const p of pts) {
    let dominated = false;
    for (const q of pts) {
      if (q === p) continue;
      if (q.cost <= p.cost && q.quality >= p.quality && (q.cost < p.cost || q.quality > p.quality)) {
        dominated = true;
        break;
      }
    }
    if (!dominated) frontier.add(p.id);
  }
  return frontier;
}

function unionBenchmarks(models) {
  const set = new Set();
  models.forEach((m) => (m.benchmarks || []).forEach((b) => set.add(b.benchmark_name)));
  return Array.from(set).sort();
}

function ModelPickerGrid({ allModels, selectedIds, onToggle, disabled }) {
  const [q, setQ] = useState("");
  const [companyTab, setCompanyTab] = useState("all");

  const { minorCompanyKeys, companyTabs } = useMemo(() => {
    const counts = new Map();
    const names = new Map();
    for (const m of allModels) {
      const key = m.companyKey || "other";
      const name = m.companyName || "Other";
      counts.set(key, (counts.get(key) || 0) + 1);
      names.set(key, name);
    }

    const major = [];
    const minorKeys = new Set();
    let minorTotal = 0;

    for (const [key, cnt] of counts.entries()) {
      if (cnt > 3) {
        major.push({ key, name: names.get(key), count: cnt });
      } else {
        minorKeys.add(key);
        minorTotal += cnt;
      }
    }
    major.sort((a, b) => b.count - a.count);

    const tabs = [
      { id: "all", label: "All Companies", count: allModels.length },
      ...major.map((c) => ({ id: c.key, label: c.name, count: c.count })),
      ...(minorTotal > 0 ? [{ id: "others", label: "Others", count: minorTotal }] : [])
    ];

    return { minorCompanyKeys: minorKeys, companyTabs: tabs };
  }, [allModels]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return allModels.filter((m) => {
      if (companyTab !== "all") {
        if (companyTab === "others") {
          if (!minorCompanyKeys.has(m.companyKey)) return false;
        } else if (m.companyKey !== companyTab) {
          return false;
        }
      }
      if (!ql) return true;
      return (
        m.name.toLowerCase().includes(ql) ||
        m.companyName.toLowerCase().includes(ql) ||
        (m.aliases || []).some((a) => a.toLowerCase().includes(ql))
      );
    });
  }, [allModels, q, companyTab, minorCompanyKeys]);

  return (
    <>
      <div className="filter-ribbon fx-rise" style={{ marginBottom: 12 }}>
        <div className="field filter-ribbon__search">
          <span aria-hidden="true" style={{ color: "var(--clay-ink-faint)" }}>⌕</span>
          <input
            type="search"
            placeholder="Search models to add…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search models"
          />
        </div>
      </div>

      {/* Company tabs for fast company filtering */}
      <div className="company-ribbon fx-rise" style={{ marginBottom: 20 }} role="tablist" aria-label="Company categories">
        {companyTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={companyTab === t.id}
            className={`company-tab ${companyTab === t.id ? "is-active" : ""}`}
            onClick={() => setCompanyTab(t.id)}
          >
            <span>{t.label}</span>
            <span className="company-tab__count">{t.count}</span>
          </button>
        ))}
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
                <div className="model-card__logo" aria-hidden="true">
                  <ModelIcon model={m} size={44} />
                </div>
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
        Tap a model card below. We'll line up architecture, raw benchmarks, efficiency, value frontier, and pricing — side by side.
      </p>
    </div>
  );
}
