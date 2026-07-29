import React, { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { fmtPrice, pickHeadlineBenchmark } from "../lib/format";
import { CB_PALETTE } from "../lib/palette";
import "./ValueFrontierChart.css";

const COLOR_INTERIOR = CB_PALETTE[7]; // grey
const COLOR_INTERIOR_STROKE = CB_PALETTE[4]; // blue
const COLOR_FRONTIER = CB_PALETTE[2]; // bluish green
const COLOR_FRONTIER_STROKE = "#00724a";

/**
 * Pareto plot of quality (Y) vs blended cost (X). Frontier points are circled.
 *
 * Props:
 *   models: array of selected model objects
 *   frontier: Set of model ids that are on the Pareto frontier (per format.js)
 */
export default function ValueFrontierChart({ models, frontier }) {
  const data = useMemo(() => {
    return models.map((m) => {
      const p = m.pricing?.[0];
      const cost = p ? (p.input_price_per_m ?? 0) * 0.25 + (p.output_price_per_m ?? 0) * 0.75 : null;
      const quality = pickHeadlineBenchmark(m.benchmarks || []);
      const onFrontier = frontier?.has(m.id);
      return {
        name: m.name || m.id,
        id: m.id,
        cost,
        quality,
        params: m.architecture_specs?.params_active
          ? (m.architecture_specs.params_active / 1e9).toFixed(1) + "B"
          : null,
        onFrontier,
        group: onFrontier ? "frontier" : "interior"
      };
    }).filter((d) => d.cost != null && d.quality != null);
  }, [models, frontier]);

  if (data.length === 0) {
    return (
      <div className="vf vf--empty clay clay--md">
        <div className="vf__emptyIcon" aria-hidden="true">◎</div>
        <h3 className="vf__emptyTitle">Value Frontier — not enough data</h3>
        <p className="vf__emptyBody">
          Need at least one model with both cost and a published benchmark score to draw the Pareto plot.
        </p>
      </div>
    );
  }

  const frontierPts = data.filter((d) => d.onFrontier);
  const interiorPts = data.filter((d) => !d.onFrontier);

  return (
    <div className="vf clay clay--md">
      <header className="vf__head">
        <h3>Value frontier</h3>
        <p className="vf__sub">
          Quality (Arena ELO when available, else max benchmark) vs. blended cost. Circled = Pareto-optimal.
        </p>
      </header>

      <div className="vf__chart">
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 12, right: 24, bottom: 12, left: 12 }}>
            <CartesianGrid stroke="rgba(140, 120, 180, 0.14)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="cost"
              name="Cost"
              scale="log"
              domain={["auto", "auto"]}
              tickFormatter={(v) => fmtPrice(v)}
              tick={{ fill: "var(--clay-ink-soft)", fontSize: 11 }}
              label={{ value: "Blended cost (USD / 1M tok)", position: "insideBottom", offset: -2, fill: "var(--clay-ink-faint)", fontSize: 11 }}
              stroke="rgba(140, 120, 180, 0.2)"
            />
            <YAxis
              type="number"
              dataKey="quality"
              name="Quality"
              tick={{ fill: "var(--clay-ink-soft)", fontSize: 11 }}
              label={{ value: "Headline score", angle: -90, position: "insideLeft", fill: "var(--clay-ink-faint)", fontSize: 11 }}
              stroke="rgba(140, 120, 180, 0.2)"
            />
            <ZAxis range={[60, 60]} />
            <Tooltip content={<VFTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "rgba(140, 120, 180, 0.4)" }} />
            <Scatter
              name="Interior"
              data={interiorPts}
              fill={COLOR_INTERIOR}
              fillOpacity={0.7}
              stroke={COLOR_INTERIOR_STROKE}
              strokeWidth={1}
              isAnimationActive={false}
            />
            <Scatter
              name="Frontier"
              data={frontierPts}
              fill={COLOR_FRONTIER}
              fillOpacity={0.85}
              stroke={COLOR_FRONTIER_STROKE}
              strokeWidth={2.5}
              isAnimationActive={false}
              shape={FrontierDot}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="vf__legend">
        <span className="vf__legendItem">
          <span className="vf__legendDot vf__legendDot--frontier" aria-hidden="true" />
          On frontier (Pareto-optimal)
        </span>
        <span className="vf__legendItem">
          <span className="vf__legendDot vf__legendDot--interior" aria-hidden="true" />
          Dominated by another model
        </span>
      </div>
    </div>
  );
}

function FrontierDot({ cx, cy, payload }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={14} fill="none" stroke={COLOR_FRONTIER} strokeWidth={2} strokeDasharray="2 3" />
      <circle cx={cx} cy={cy} r={6} fill={COLOR_FRONTIER} stroke={COLOR_FRONTIER_STROKE} strokeWidth={2} />
    </g>
  );
}

function VFTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="vf__tooltip">
      <div className="vf__tooltipTitle">{d.name}</div>
      <div className="vf__tooltipRow">
        <span>Cost</span>
        <span className="vf__tooltipVal">{fmtPrice(d.cost)}</span>
      </div>
      <div className="vf__tooltipRow">
        <span>Score</span>
        <span className="vf__tooltipVal">{Math.round(d.quality)}</span>
      </div>
      {d.params && (
        <div className="vf__tooltipRow">
          <span>Active params</span>
          <span className="vf__tooltipVal">{d.params}</span>
        </div>
      )}
      <div className={`vf__tooltipStatus ${d.onFrontier ? "is-frontier" : "is-interior"}`}>
        {d.onFrontier ? "Pareto-optimal" : "Dominated"}
      </div>
    </div>
  );
}
