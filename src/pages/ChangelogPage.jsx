import React, { useContext, useEffect, useMemo, useState } from "react";
import { DataContext } from "../context/DataContext";
import { useRevealLive } from "../hooks/useReveal";
import { fmtDate } from "../lib/format";
import "./ChangelogPage.css";

const SOURCE_LABELS = {
  openrouter: "OpenRouter",
  huggingface: "HuggingFace Hub",
  leaderboard: "HF Open LLM Leaderboard",
  arena: "LMArena mirror",
  normalize: "Normalize + resolve",
  enrich: "Enrich (config.json, pricing)"
};

export default function ChangelogPage() {
  const { data } = useContext(DataContext);
  const [runs, setRuns] = useState(null);
  const [error, setError] = useState(null);

  useRevealLive([runs?.length]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${process.env.PUBLIC_URL}/pipeline_runs.jsonl`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (cancelled) return;
        const parsed = text
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            try { return JSON.parse(line); }
            catch { return null; }
          })
          .filter(Boolean)
          .reverse(); // newest first
        setRuns(parsed);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const companies = data.companies || {};
    const totalModels = Object.values(companies).reduce((acc, c) => acc + (c.models || []).length, 0);
    const families = {};
    for (const c of Object.values(companies)) {
      for (const m of c.models || []) {
        families[m.family] = (families[m.family] || 0) + 1;
      }
    }
    return { totalModels, families, companyCount: Object.keys(companies).length };
  }, [data]);

  const additionsByDay = useMemo(() => {
    if (!data) return [];
    const map = new Map();
    for (const c of Object.values(data.companies || {})) {
      for (const m of c.models || []) {
        const day = (m.architecture_specs?.fetched_at || "").slice(0, 10);
        if (!day) continue;
        if (!map.has(day)) map.set(day, []);
        map.get(day).push({ id: m.id, name: m.name, family: m.family, company: c.name });
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 14);
  }, [data]);

  return (
    <div className="section fx-fade changelog-page">
      <header className="fx-rise" style={{ marginBottom: 32 }}>
        <h1>Changelog</h1>
        <p style={{ color: "var(--clay-ink-soft)", marginTop: 6, maxWidth: 720 }}>
          Recent ingestion runs and the models they added. The pipeline runs daily
          via GitHub Actions; this page is regenerated from the latest <code>pipeline_runs.jsonl</code>.
        </p>
      </header>

      <section className="clay fx-rise" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: "1.05rem" }}>Catalog snapshot</h2>
        {stats ? (
          <div className="changelog-stats">
            <Stat label="Total models" value={stats.totalModels} />
            <Stat label="Companies" value={stats.companyCount} />
            <Stat label="Dense" value={stats.families.dense || 0} />
            <Stat label="MoE" value={stats.families.moe || 0} />
            <Stat label="Hybrid SSM" value={stats.families.hybrid_attention_ssm || 0} />
            <Stat label="Looped" value={stats.families.looped || 0} />
            <Stat label="Multimodal" value={stats.families.multimodal || 0} />
            <Stat label="Last update" value={data.last_updated ? fmtDate(data.last_updated) : "—"} />
          </div>
        ) : (
          <p style={{ color: "var(--clay-ink-faint)" }}>Loading…</p>
        )}
      </section>

      <section className="fx-rise" style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 12 }}>Recent ingestion runs</h2>
        {error && (
          <div className="clay" style={{ padding: 16, color: "var(--clay-ink-soft)" }}>
            Couldn't load <code>pipeline_runs.jsonl</code>: {error}
          </div>
        )}
        {!runs && !error && (
          <p style={{ color: "var(--clay-ink-faint)" }}>Loading runs…</p>
        )}
        {runs && runs.length === 0 && (
          <p style={{ color: "var(--clay-ink-soft)" }}>No pipeline runs recorded yet.</p>
        )}
        {runs && runs.length > 0 && (
          <div className="changelog-runs">
            {runs.map((r, i) => (
              <RunRow key={i} run={r} />
            ))}
          </div>
        )}
      </section>

      <section className="fx-rise">
        <h2 style={{ marginBottom: 12 }}>Models added per day</h2>
        <p style={{ color: "var(--clay-ink-soft)", marginTop: 0, fontSize: "0.9rem" }}>
          Grouped by <code>fetched_at</code> from the canonical dataset. Most recent 14 days shown.
        </p>
        {additionsByDay.length === 0 && (
          <p style={{ color: "var(--clay-ink-faint)" }}>No <code>fetched_at</code> timestamps recorded.</p>
        )}
        <div className="changelog-additions">
          {additionsByDay.map(([day, models]) => (
            <details key={day} className="changelog-day" open={day === additionsByDay[0]?.[0]}>
              <summary>
                <span className="changelog-day__date">{fmtDate(day)}</span>
                <span className="changelog-day__count">{models.length} model{models.length === 1 ? "" : "s"}</span>
              </summary>
              <ul className="changelog-day__list">
                {models.slice(0, 50).map((m) => (
                  <li key={m.id}>
                    <span className="changelog-day__name">{m.name}</span>
                    <span className="changelog-day__company">{m.company}</span>
                    <span className="chip">{m.family.replace(/_/g, " ")}</span>
                  </li>
                ))}
                {models.length > 50 && (
                  <li style={{ color: "var(--clay-ink-faint)", fontStyle: "italic" }}>
                    + {models.length - 50} more…
                  </li>
                )}
              </ul>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="changelog-stat">
      <div className="changelog-stat__value">{value}</div>
      <div className="changelog-stat__label">{label}</div>
    </div>
  );
}

function RunRow({ run }) {
  const hasErrors = (run.errors || []).length > 0;
  return (
    <div className={`changelog-run ${hasErrors ? "changelog-run--err" : ""}`}>
      <div className="changelog-run__head">
        <span className="changelog-run__source">{SOURCE_LABELS[run.source] || run.source}</span>
        <span className="changelog-run__time">{fmtDate(run.started_at)} · {new Date(run.started_at).toUTCString().slice(17, 22)} UTC</span>
      </div>
      <div className="changelog-run__meta">
        <span><strong>{run.new_models_found || 0}</strong> new</span>
        <span><strong>{run.matched_to_existing || 0}</strong> matched to existing</span>
        <span>{ms(run.started_at, run.finished_at)} ms</span>
      </div>
      {hasErrors && (
        <ul className="changelog-run__errors">
          {run.errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </div>
  );
}

function ms(start, end) {
  try {
    const a = Date.parse(start), b = Date.parse(end);
    return Math.max(0, b - a);
  } catch { return "—"; }
}
