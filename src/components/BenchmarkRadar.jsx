import React, { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { fmtScore } from "../lib/format";
import { seriesColors } from "../lib/palette";
import "./BenchmarkRadar.css";

const PALETTE = seriesColors(4);

const SHORT = {
  "mmlu": "MMLU",
  "humaneval": "HumanEval",
  "gsm8k": "GSM8K",
  "hellaswag": "HellaSwag",
  "truthfulqa": "TruthfulQA",
  "ifeval": "IFEval",
  "bigbench": "BIG-Bench",
  "alpaca-eval": "AlpacaEval",
  "arena[-_ ]?elo": "Arena ELO",
  "chatbot[-_ ]?arena": "Arena ELO",
  "swebench": "SWE-Bench",
  "aime": "AIME",
  "math": "MATH",
  "arc": "ARC",
  "drop": "DROP",
  "winogrande": "WinoGrande",
  "openllms": "OTB",
  "leaderboard": "OTB"
};

function shortName(full) {
  const lower = full.toLowerCase();
  for (const [pattern, label] of Object.entries(SHORT)) {
    if (new RegExp(pattern, "i").test(lower)) return label;
  }
  return full.length > 14 ? full.slice(0, 12) + "…" : full;
}

function scoreNorm100(score) {
  if (score == null || Number.isNaN(score)) return null;
  return score <= 1 ? score * 100 : score;
}

function getScore(model, name) {
  const b = (model.benchmarks || []).find((x) => x.benchmark_name === name);
  return b?.score ?? null;
}

/**
 * Radar of normalized benchmark scores (0-100 per axis, max in selected set = 100).
 * Missing data renders as 0 with a hollow marker so the gap is visible.
 *
 * Props:
 *   models: array of selected model objects
 */
export default function BenchmarkRadar({ models }) {
  const { data, axes, legendLabels } = useMemo(() => {
    const allBn = new Set();
    models.forEach((m) => (m.benchmarks || []).forEach((b) => allBn.add(b.benchmark_name)));
    const axes = Array.from(allBn).sort();

    const maxPerAxis = axes.map((axis) => {
      let max = 0;
      models.forEach((m) => {
        const s = scoreNorm100(getScore(m, axis));
        if (s != null && s > max) max = s;
      });
      return max > 0 ? max : 100;
    });

    const data = axes.map((axis, i) => {
      const row = { axis: shortName(axis), axisFull: axis };
      models.forEach((m) => {
        const raw = getScore(m, axis);
        const s = scoreNorm100(raw);
        const normalized = s == null ? 0 : (s / maxPerAxis[i]) * 100;
        row[m.id] = +(normalized.toFixed(1));
      });
      return row;
    });

    const legendLabels = models.map((m) => {
      const name = m.name || m.id;
      return name.length > 24 ? `${name.slice(0, 22)}…` : name;
    });

    return { data, axes, legendLabels };
  }, [models]);

  if (axes.length === 0) {
    return (
      <div className="radar radar--empty clay clay--md">
        <div className="radar__emptyIcon" aria-hidden="true">⊙</div>
        <h3 className="radar__emptyTitle">No benchmark data</h3>
        <p className="radar__emptyBody">
          None of the selected models have published benchmarks yet. The radar needs at least one benchmark axis to render.
        </p>
      </div>
    );
  }

  const noDataModels = models.filter((m) => (m.benchmarks || []).length === 0);

  return (
    <div className="radar clay clay--md">
      <header className="radar__head">
        <h3>Radar — benchmarks</h3>
        <p className="radar__sub">
          Each axis = one benchmark. 100 = best in this set. Hollow markers = missing data.
        </p>
      </header>

      <div className="radar__chart">
        <ResponsiveContainer width="100%" height={360}>
          <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid stroke="rgba(140, 120, 180, 0.18)" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--clay-ink-soft)", fontSize: 11 }} />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "var(--clay-ink-faint)", fontSize: 10 }}
              tickCount={4}
              stroke="rgba(140, 120, 180, 0.18)"
            />
            {models.map((m, i) => (
              <Radar
                key={m.id}
                name={legendLabels[i]}
                dataKey={m.id}
                stroke={PALETTE[i % PALETTE.length]}
                fill={PALETTE[i % PALETTE.length]}
                fillOpacity={0.18}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                isAnimationActive={false}
              />
            ))}
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 6 }}
              iconType="circle"
              iconSize={8}
            />
            <Tooltip
              content={<RadarTooltip models={models} />}
              cursor={{ stroke: "rgba(140, 120, 180, 0.3)" }}
              wrapperStyle={{ outline: "none" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {noDataModels.length > 0 && (
        <p className="radar__note">
          {noDataModels.length === models.length
            ? "No model has benchmark data."
            : `No benchmarks for: ${noDataModels.map((m) => m.name).join(", ")}.`}
        </p>
      )}
    </div>
  );
}

function RadarTooltip({ active, payload, label, models }) {
  if (!active || !payload?.length) return null;
  const axisFull = payload?.[0]?.payload?.axisFull || label;
  return (
    <div className="radar__tooltip">
      <div className="radar__tooltipTitle">{axisFull}</div>
      {payload.map((p, i) => {
        const id = p.dataKey;
        const m = models.find((x) => x.id === id);
        const raw = (m?.benchmarks || []).find((x) => x.benchmark_name === axisFull);
        const rawScore = raw?.score;
        return (
          <div key={i} className="radar__tooltipRow">
            <span className="radar__tooltipDot" style={{ background: p.color }} />
            <span className="radar__tooltipName">{p.name}</span>
            <span className="radar__tooltipVal">
              {rawScore == null ? "no data" : fmtScore(rawScore, axisFull)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
