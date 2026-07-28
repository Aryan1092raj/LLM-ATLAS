import React from "react";
import { fmtDate } from "../lib/format";

function pct(score, name) {
  // Normalize to 0-1 for bar width
  if (/arena[-_ ]?elo/i.test(name)) return Math.max(0, Math.min(1, (score - 1000) / 400));
  if (score > 100) return Math.max(0, Math.min(1, score / 100));
  return Math.max(0, Math.min(1, score));
}

export default function BenchmarksTable({ benchmarks }) {
  if (!benchmarks || benchmarks.length === 0) {
    return (
      <div className="bench-empty fx-fade">
        <strong>Benchmarks pending.</strong>
        <p style={{ marginTop: 8, color: "var(--clay-ink-faint)", fontSize: "0.9rem" }}>
          This model hasn't accumulated enough independent evaluations yet. The backfill pipeline will pick it up as Arena/HF-leaderboard data arrives.
        </p>
      </div>
    );
  }

  const sorted = [...benchmarks].sort((a, b) => b.score - a.score);

  return (
    <div className="clay clay--sm" style={{ padding: 8, overflow: "hidden" }}>
      <table className="bench-table">
        <thead>
          <tr>
            <th>Benchmark</th>
            <th>Score</th>
            <th>Source</th>
            <th>Fetched</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((b) => (
            <tr key={b.benchmark_name}>
              <td><strong>{b.benchmark_name}</strong></td>
              <td>
                <span className="bench-table__score">{formatScore(b.score, b.benchmark_name)}</span>
                <span
                  className="bench-table__score-bar"
                  style={{ width: `${pct(b.score, b.benchmark_name) * 100}%` }}
                  aria-hidden="true"
                />
              </td>
              <td>
                <a href={b.source_url} target="_blank" rel="noreferrer" style={{ color: "var(--clay-accent)", textDecoration: "underline" }}>
                  {b.source}
                </a>
              </td>
              <td style={{ color: "var(--clay-ink-faint)", fontSize: "0.85rem" }}>{fmtDate(b.fetched_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatScore(score, name) {
  if (/arena[-_ ]?elo/i.test(name)) return String(Math.round(score));
  if (score <= 1) return (score * 100).toFixed(2);
  if (score < 10) return score.toFixed(2);
  return score.toFixed(1);
}