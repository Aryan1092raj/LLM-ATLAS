import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../context/DataContext";
import { useRevealLive } from "../hooks/useReveal";
import { getReleaseDate } from "../data/timelineSeed";
import {
  fmtParams,
  fmtContext,
  familyLabel,
  pickHeadlineBenchmark,
  fmtScore
} from "../lib/format";
import { FAMILY_COLORS, FAMILY_COLORS_FALLBACK as DOT_COLOR_FALLBACK } from "../lib/palette";
import "./FamiliesPage.css";

const LANE_ORDER = ["dense", "moe", "hybrid_attention_ssm", "looped", "multimodal"];

export default function TimelinePage() {
  const { allModels } = useContext(DataContext);
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(() => new Set());
  const [hover, setHover] = useState(null); // { model, x, y }

  useRevealLive([allModels.length, hidden.size]);

  const points = useMemo(() => {
    const out = [];
    for (const m of allModels) {
      const d = getReleaseDate(m);
      if (!d) continue;
      const ts = Date.parse(d);
      if (Number.isNaN(ts)) continue;
      out.push({ model: m, date: d, ts });
    }
    out.sort((a, b) => a.ts - b.ts);
    return out;
  }, [allModels]);

  const { minTs, maxTs, yearTicks } = useMemo(() => {
    if (!points.length) return { minTs: 0, maxTs: 0, yearTicks: [] };
    const min = points[0].ts;
    const max = points[points.length - 1].ts;
    const minYear = new Date(min).getUTCFullYear();
    const maxYear = new Date(max).getUTCFullYear();
    const ticks = [];
    for (let y = minYear; y <= maxYear; y++) {
      ticks.push({ year: y, ts: Date.UTC(y, 0, 1) });
    }
    return { minTs: min, maxTs: max, yearTicks: ticks };
  }, [points]);

  const span = Math.max(maxTs - minTs, 1);
  const laneHeight = 88;
  const padLeft = 150;
  const padRight = 24;

  const xPct = (ts) => ((ts - minTs) / span) * 100;

  const lanes = useMemo(() => {
    const map = new Map();
    for (const fam of LANE_ORDER) {
      map.set(fam, []);
    }
    for (const p of points) {
      if (!map.has(p.model.family)) continue;
      map.get(p.model.family).push(p);
    }
    return map;
  }, [points]);

  const totalCount = points.length;

  const toggle = (fam) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(fam)) next.delete(fam);
      else next.add(fam);
      return next;
    });
  };

  return (
    <div className="section fx-fade timeline-page">
      <header className="fx-rise">
        <h1>Architecture evolution</h1>
        <p style={{ color: "var(--clay-ink-soft)", marginTop: 6, maxWidth: 720 }}>
          Real model releases plotted on a timeline. Each lane is an architecture family;
          dot size scales with total parameters; hover for headline score and context window.
        </p>
        <div style={{ marginTop: 12 }}>
          <span className="timeline-era">Era 1 — dense dominance</span>
          <span className="timeline-era">Era 2 — MoE goes mainstream (late 2023 →)</span>
          <span className="timeline-era">Era 3 — hybrid attention + long context (2024 →)</span>
          <span className="timeline-era">Era 4 — looped / parameter-shared small models (2025 →)</span>
        </div>
      </header>

      <div className="timeline-controls">
        <span style={{ color: "var(--clay-ink-soft)", fontSize: "0.85rem" }}>
          {totalCount} plotted · click dot to open · click legend to filter
        </span>
        <div className="timeline-legend" role="group" aria-label="Family filter">
          {LANE_ORDER.map((fam) => {
            const off = hidden.has(fam);
            return (
              <button
                key={fam}
                type="button"
                className={`timeline-legend__item ${off ? "is-off" : ""}`}
                onClick={() => toggle(fam)}
                aria-pressed={!off}
              >
                <span
                  className="timeline-legend__dot"
                  style={{ background: FAMILY_COLORS[fam] || DOT_COLOR_FALLBACK }}
                />
                {familyLabel(fam)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="timeline-canvas fx-rise">
        {points.length === 0 ? (
          <div className="timeline-empty">No dated models in the dataset yet.</div>
        ) : (
          <div className="timeline-grid">
            <div className="timeline-axis" style={{ marginLeft: padLeft, marginRight: padRight }}>
              {yearTicks.map((t) => (
                <span
                  key={t.year}
                  className="timeline-axis__tick"
                  style={{ left: `${xPct(t.ts)}%` }}
                >
                  {t.year}
                </span>
              ))}
            </div>

            {LANE_ORDER.map((fam) => {
              const lanePoints = (lanes.get(fam) || []).filter((p) => !hidden.has(fam));
              return (
                <div
                  key={fam}
                  className="timeline-lane"
                  style={{ height: laneHeight }}
                >
                  <span className="timeline-lane__label">
                    {familyLabel(fam)}
                  </span>
                  <div className="timeline-lane__rail" style={{ left: padLeft, right: padRight }} />
                  {lanePoints.map((p) => {
                    const total = p.model.architecture_specs?.params_total;
                    // Dot radius: 5 → 22 mapped log from 1B → 1T params
                    const r = total
                      ? Math.max(5, Math.min(22, 5 + Math.log10(total / 1e9) * 4))
                      : 7;
                    return (
                      <button
                        key={p.model.id}
                        type="button"
                        className="timeline-dot"
                        style={{
                          left: `calc(${padLeft}px + (100% - ${padLeft + padRight}px) * ${xPct(p.ts) / 100})`,
                          zIndex: 1,
                          width: r * 2,
                          height: r * 2,
                          background: FAMILY_COLORS[fam] || DOT_COLOR_FALLBACK,
                          borderStyle: p.model.architecture_specs?.disclosure === "closed_undisclosed" ? "dashed" : "solid"
                        }}
                        aria-label={`${p.model.name}, ${p.date}`}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const canvas = e.currentTarget.closest(".timeline-canvas").getBoundingClientRect();
                          setHover({
                            model: p.model,
                            x: rect.left - canvas.left + rect.width / 2,
                            y: rect.top - canvas.top - 8
                          });
                        }}
                        onMouseLeave={() => setHover(null)}
                        onFocus={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const canvas = e.currentTarget.closest(".timeline-canvas").getBoundingClientRect();
                          setHover({
                            model: p.model,
                            x: rect.left - canvas.left + rect.width / 2,
                            y: rect.top - canvas.top - 8
                          });
                        }}
                        onBlur={() => setHover(null)}
                        onClick={() => navigate(`/model/${encodeURIComponent(p.model.id)}`)}
                      />
                    );
                  })}
                </div>
              );
            })}

            {hover && (
              <TimelineTooltip hover={hover} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineTooltip({ hover }) {
  const m = hover.model;
  const headline = pickHeadlineBenchmark(m.benchmarks || []);
  const headlineName = (m.benchmarks || []).find((b) => b.score === headline)?.benchmark_name || "—";
  const x = Math.max(120, Math.min(hover.x, 600));
  const y = Math.max(0, hover.y - 90);
  return (
    <div
      className="timeline-tooltip"
      style={{ left: x, top: y, transform: "translate(-50%, 0)" }}
      role="tooltip"
    >
      <div className="timeline-tooltip__name">{m.name}</div>
      <div className="timeline-tooltip__org">{m.companyName} · {m.architecture_specs?.fetched_at?.slice(0, 10) || "—"}</div>
      <div className="timeline-tooltip__row"><span>Family</span><strong>{familyLabel(m.family)}</strong></div>
      <div className="timeline-tooltip__row"><span>Total</span><strong>{fmtParams(m.architecture_specs?.params_total)}</strong></div>
      <div className="timeline-tooltip__row"><span>Active</span><strong>{fmtParams(m.architecture_specs?.params_active)}</strong></div>
      <div className="timeline-tooltip__row"><span>Context</span><strong>{fmtContext(m.architecture_specs?.context_window)}</strong></div>
      <div className="timeline-tooltip__row"><span>{headlineName}</span><strong>{headline != null ? fmtScore(headline, headlineName) : "—"}</strong></div>
    </div>
  );
}
