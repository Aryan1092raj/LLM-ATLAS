import React from "react";
import { efficiencyScore, fmtParams, pickHeadlineBenchmark, fmtScore } from "../lib/format";
import "./EfficiencyScoreCard.css";

/**
 * Small clay card showing a single model's efficiency score + ingredients.
 *
 * Props:
 *   model: object with architecture_specs, benchmarks, name
 *   rank: 0-indexed rank in the selected set (best = 0)
 *   total: total number of selected models
 */
export default function EfficiencyScoreCard({ model, rank, total }) {
  const e = efficiencyScore(model);
  const score = pickHeadlineBenchmark(model.benchmarks || []);
  const params = model.architecture_specs?.params_active;
  const hasBench = (model.benchmarks || []).length > 0;
  const hasParams = params != null;

  const isBest = rank === 0 && e != null;
  const isNaN = e == null;

  return (
    <article className={`esc clay clay--md ${isBest ? "is-best" : ""} ${isNaN ? "is-empty" : ""}`}>
      <header className="esc__head">
        <h4 className="esc__name">{model.name}</h4>
        {isBest && (
          <span className="esc__badge" aria-label="Most efficient in selection">
            <span aria-hidden="true">★</span> Most efficient
          </span>
        )}
      </header>

      <div className="esc__score">
        {isNaN ? (
          <span className="esc__empty">—</span>
        ) : (
          <>
            <span className="esc__num">{e.toFixed(2)}</span>
            <span className="esc__unit">score / B-params</span>
          </>
        )}
      </div>

      <dl className="esc__ingredients">
        <div className="esc__ingredient">
          <dt>Headline score</dt>
          <dd>{hasBench ? fmtScore(score, (model.benchmarks.find((b) => b.score === score) || {}).benchmark_name || "") : "—"}</dd>
        </div>
        <div className="esc__ingredient">
          <dt>Active params</dt>
          <dd>{hasParams ? fmtParams(params) : "—"}</dd>
        </div>
      </dl>

      <p className="esc__formula">
        <code>score ÷ active params (B)</code>
      </p>

      {isNaN && (
        <p className="esc__note">
          Cannot compute — needs at least one benchmark and a published active-params count.
        </p>
      )}
    </article>
  );
}
