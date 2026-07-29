import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { fmtPrice } from "../lib/format";
import "./CostBarChart.css";

/**
 * Horizontal-grouped bar of input / output / blended cost per 1M tokens.
 * Log scale on Y so very cheap and very expensive models share the axis.
 *
 * Props:
 *   models: array of selected model objects
 */
export default function CostBarChart({ models }) {
  const data = useMemo(() => {
    return models.map((m) => {
      const p = m.pricing?.[0];
      const input = p?.input_price_per_m ?? null;
      const output = p?.output_price_per_m ?? null;
      const blended = p ? (input ?? 0) * 0.25 + (output ?? 0) * 0.75 : null;
      return {
        name: shortName(m),
        input: input ?? 0,
        output: output ?? 0,
        blended: blended ?? 0,
        _hasInput: input != null,
        _hasOutput: output != null,
        _hasBlended: blended != null
      };
    });
  }, [models]);

  const anyPricing = data.some((d) => d._hasInput || d._hasOutput);

  if (!anyPricing) {
    return (
      <div className="costbar costbar--empty clay clay--md">
        <div className="costbar__emptyIcon" aria-hidden="true">$</div>
        <h3 className="costbar__emptyTitle">No pricing data</h3>
        <p className="costbar__emptyBody">
          None of the selected models have published pricing. We can't draw the cost axis without it.
        </p>
      </div>
    );
  }

  const maxVal = Math.max(...data.flatMap((d) => [d.input, d.output, d.blended]).filter((v) => v > 0), 1);

  return (
    <div className="costbar clay clay--md">
      <header className="costbar__head">
        <h3>Cost — USD per 1M tokens</h3>
        <p className="costbar__sub">
          Log scale. Blended = 25% input + 75% output. Latency not yet measured.
        </p>
      </header>

      <div className="costbar__chart">
        <ResponsiveContainer width="100%" height={Math.max(220, 50 + 50 * models.length)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 12, right: 24, bottom: 8, left: 12 }}
            barCategoryGap="22%"
          >
            <CartesianGrid stroke="rgba(140, 120, 180, 0.14)" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              scale="log"
              domain={[0.01, Math.ceil(maxVal * 1.2)]}
              tickFormatter={(v) => fmtPrice(v)}
              tick={{ fill: "var(--clay-ink-soft)", fontSize: 11 }}
              stroke="rgba(140, 120, 180, 0.2)"
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "var(--clay-ink)", fontSize: 12, fontWeight: 600 }}
              width={140}
              stroke="rgba(140, 120, 180, 0.2)"
            />
            <Tooltip content={<CostTooltip />} cursor={{ fill: "rgba(140, 120, 180, 0.08)" }} />
            <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
            <Bar dataKey="input" name="Input" fill="#8b7cf6" radius={[0, 6, 6, 0]} isAnimationActive={false} />
            <Bar dataKey="output" name="Output" fill="#66c4b8" radius={[0, 6, 6, 0]} isAnimationActive={false} />
            <Bar dataKey="blended" name="Blended 25/75" fill="#ff9aa8" radius={[0, 6, 6, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="costbar__note">
        Numbers come from OpenRouter's pricing mirror. Free-tier providers show as <code>$0.000</code>.
      </p>
    </div>
  );
}

function shortName(m) {
  const name = m.name || m.id;
  return name.length > 24 ? `${name.slice(0, 22)}…` : name;
}

function CostTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="costbar__tooltip">
      <div className="costbar__tooltipTitle">{row?.name}</div>
      <div className="costbar__tooltipRow">
        <span className="costbar__tooltipDot" style={{ background: "#8b7cf6" }} />
        <span>Input</span>
        <span className="costbar__tooltipVal">{row?._hasInput ? fmtPrice(row.input) : "—"}</span>
      </div>
      <div className="costbar__tooltipRow">
        <span className="costbar__tooltipDot" style={{ background: "#66c4b8" }} />
        <span>Output</span>
        <span className="costbar__tooltipVal">{row?._hasOutput ? fmtPrice(row.output) : "—"}</span>
      </div>
      <div className="costbar__tooltipRow">
        <span className="costbar__tooltipDot" style={{ background: "#ff9aa8" }} />
        <span>Blended</span>
        <span className="costbar__tooltipVal">{row?._hasBlended ? `$${row.blended.toFixed(3)}` : "—"}</span>
      </div>
    </div>
  );
}
