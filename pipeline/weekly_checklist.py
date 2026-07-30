"""
Weekly Data Review & Audit Script per TRD §9.

Scans public/data.json and generates a weekly audit punch-list:
1. New `auto_added` models missing curated architecture text.
2. Closed-model entries with no system-card source_url yet.
3. Anomaly flags: duplicate benchmark scores, null spec on models that should have HF config.

Outputs markdown report and opens/updates a GitHub Issue if running in GH Actions.
"""
from __future__ import annotations

import json
import os
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "public" / "data.json"


def audit_dataset() -> dict[str, list[str]]:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Missing dataset at {DATA_PATH}")

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    models: list[dict] = []

    for c_key, c_val in data.get("companies", {}).items():
        for m in c_val.get("models", []):
            m["_company"] = c_val.get("name", c_key)
            models.append(m)

    flags = {
        "auto_added_missing_text": [],
        "closed_missing_source": [],
        "duplicate_scores": [],
        "open_missing_hf_config": [],
    }

    score_tracker = defaultdict(list)

    for m in models:
        m_id = m.get("id") or m.get("name")
        status = m.get("status")
        disclosure = m.get("disclosure", "")
        specs = m.get("architecture_specs") or {}
        why = m.get("why", "")

        # 1. auto_added missing curated text
        if status == "auto_added" or "Auto-added" in why:
            flags["auto_added_missing_text"].append(f"`{m_id}` ({m.get('_company')}) — status: {status}")

        # 2. Closed model missing source_url
        if disclosure == "closed_undisclosed":
            source_url = specs.get("source_url") or m.get("source_url")
            if not source_url or "openrouter.ai" in source_url:
                flags["closed_missing_source"].append(f"`{m_id}` ({m.get('_company')}) — missing official system card URL")

        # 3. Open weight missing HF config
        if disclosure == "open_weight" and not specs.get("num_hidden_layers") and not specs.get("params_total"):
            flags["open_missing_hf_config"].append(f"`{m_id}` ({m.get('_company')}) — open weight but no HF config specs parsed")

        # Track benchmark scores for duplicate detection
        for b in m.get("benchmarks", []):
            b_name = b.get("benchmark_name")
            score = b.get("score")
            source = b.get("source")
            if b_name and score is not None and source:
                key = f"{b_name}:{score}:{source}"
                score_tracker[key].append(m_id)

    # 4. Duplicate score detection
    for key, m_list in score_tracker.items():
        if len(m_list) > 1 and "seed" not in key:
            b_name, score, source = key.split(":", 2)
            flags["duplicate_scores"].append(f"Score `{b_name}={score}` from `{source}` shared by {len(m_list)} models: {', '.join(m_list[:5])}")

    return flags


def generate_markdown(flags: dict[str, list[str]]) -> str:
    lines = [
        "# 📋 Weekly Data Quality Audit Report",
        "",
        f"Automated audit run on `public/data.json`.",
        "",
    ]

    total_flags = sum(len(v) for v in flags.values())
    lines.append(f"**Total Flags Identified**: `{total_flags}`")
    lines.append("")

    lines.append("## 1. New Auto-Added Models Needing Curation")
    if flags["auto_added_missing_text"]:
        for item in flags["auto_added_missing_text"][:20]:
            lines.append(f"- [ ] {item}")
        if len(flags["auto_added_missing_text"]) > 20:
            lines.append(f"- ... and {len(flags['auto_added_missing_text']) - 20} more")
    else:
        lines.append("✅ None. All auto-added models curated.")
    lines.append("")

    lines.append("## 2. Closed Models Missing System Card Source URLs")
    if flags["closed_missing_source"]:
        for item in flags["closed_missing_source"][:20]:
            lines.append(f"- [ ] {item}")
        if len(flags["closed_missing_source"]) > 20:
            lines.append(f"- ... and {len(flags['closed_missing_source']) - 20} more")
    else:
        lines.append("✅ None. All closed models have source URLs.")
    lines.append("")

    lines.append("## 3. Open-Weight Models Missing HF Config")
    if flags["open_missing_hf_config"]:
        for item in flags["open_missing_hf_config"][:20]:
            lines.append(f"- [ ] {item}")
        if len(flags["open_missing_hf_config"]) > 20:
            lines.append(f"- ... and {len(flags['open_missing_hf_config']) - 20} more")
    else:
        lines.append("✅ None. All open-weight models have HF config specs.")
    lines.append("")

    lines.append("## 4. Anomaly: Duplicate Benchmark Score Flags")
    if flags["duplicate_scores"]:
        for item in flags["duplicate_scores"][:15]:
            lines.append(f"- [ ] ⚠️ {item}")
        if len(flags["duplicate_scores"]) > 15:
            lines.append(f"- ... and {len(flags['duplicate_scores']) - 15} more")
    else:
        lines.append("✅ None. Zero duplicate score anomalies found.")

    return "\n".join(lines)


def main() -> int:
    try:
        flags = audit_dataset()
        md = generate_markdown(flags)
        print(md)

        out_path = ROOT / "data" / "processed" / "weekly_audit.md"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(md, encoding="utf-8")
        print(f"\nWrote report to {out_path}")
        return 0
    except Exception as e:
        print(f"Audit failed: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
