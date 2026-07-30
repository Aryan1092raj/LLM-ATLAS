"""
Normalize stage.

Reads per-source raw snapshots under data/raw/<source>/<date>.json, runs
entity resolution per TRD §5.2 against the existing canonical dataset
(data/processed/data.json), and produces:

    data/processed/<date>/normalized.json
        {
          "matched":   [ {"source": "...", "raw_id": "...", "canonical_id": "...", "confidence": 0.92} ],
          "new":       [ {"source": "...", "raw_id": "...", "name": "...", "vendor": "..."} ],
          "skipped":   [ {"source": "...", "raw_id": "...", "reason": "fine-tune"} ]
        }

Also writes a thin alias index alongside it for the next stage (enrichment)
to use without re-loading the full dataset.

Run:
    python -m pipeline.normalize
"""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib import (
    CANONICAL_PATH,
    DATA_PROCESSED,
    DATA_RAW,
    RunStats,
    cli_summary,
    configure_logging,
    now,
    read_json,
    write_json,
    write_run,
)
from resolve.normalize import (
    DEFAULT_THRESHOLD,
    normalize_name,
    resolve,
)


# ---------------------------------------------------------------------------
# Canonical index (built from existing processed/data.json)
# ---------------------------------------------------------------------------

@dataclass
class CanonicalIndex:
    """In-memory index of the current canonical dataset."""
    # normalized_canonical_name -> { company_key, model_idx }
    by_name: dict[str, dict] = field(default_factory=dict)
    # normalized_alias -> normalized_canonical_name
    aliases: dict[str, str] = field(default_factory=dict)
    # canonical_name -> company_key (for fast add-to-company)
    canonical_to_company: dict[str, str] = field(default_factory=dict)
    # human-friendly company_name by key
    companies: dict[str, dict] = field(default_factory=dict)
    # raw data.json (mutable copy that becomes the new data.json after commit)
    data: dict = field(default_factory=dict)

    @classmethod
    def load(cls, path: Path) -> "CanonicalIndex":
        idx = cls()
        if not path.exists():
            idx.data = {
                "schema_version": 1,
                "last_updated": now(),
                "sources": {
                    "primary": [
                        {"name": "Hugging Face Open LLM Leaderboard", "url": "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard"},
                        {"name": "LMArena (via api.wulong.dev mirror)", "url": "https://api.wulong.dev"},
                        {"name": "OpenRouter", "url": "https://openrouter.ai/api/v1/models"},
                        {"name": "Epoch AI — Notable Models", "url": "https://epochai.org/data/notable-models"},
                    ]
                },
                "families": ["dense", "moe", "hybrid_attention_ssm", "looped", "multimodal"],
                "companies": {},
            }
            return idx
        data = read_json(path)
        idx.data = data
        for ck, company in (data.get("companies") or {}).items():
            idx.companies[ck] = company
            idx.canonical_to_company[normalize_name(company.get("name", ""))] = ck
            for mi, model in enumerate(company.get("models") or []):
                norm = normalize_name(model.get("name", ""))
                if norm:
                    idx.by_name[norm] = {"company_key": ck, "model_idx": mi}
                for alias in (model.get("aliases") or []):
                    idx.aliases[normalize_name(alias)] = norm
                # Also index the canonical id if present, as an alias fallback.
                mid = model.get("id")
                if mid:
                    idx.aliases[normalize_name(mid)] = norm
        return idx


# ---------------------------------------------------------------------------
# Source → vendor inference (very lightweight)
# ---------------------------------------------------------------------------

VENDOR_HINTS = {
    "openai/": "openai", "openai:": "openai",
    "anthropic/": "anthropic",
    "google/": "google",
    "meta-llama/": "meta", "meta/": "meta",
    "deepseek/": "deepseek", "deepseek-ai/": "deepseek",
    "mistralai/": "mistral", "mistral/": "mistral",
    "qwen/": "qwen",
    "tiiuae/": "falcon",
    "nanbeige/": "nanbeige",
    "xai/": "xai",
    "cohere/": "cohere",
    "stabilityai/": "stability",
    "bytedance/": "bytedance",
    "01-ai/": "01-ai",
    "nousresearch/": "nousresearch",
    "allenai/": "allenai",
}


def vendor_key_for(source: str, raw_id: str, name: str) -> str:
    blob = f"{raw_id}\n{name}".lower()
    for hint, key in VENDOR_HINTS.items():
        if hint in blob:
            return key
    # Fall back to first segment of "ns/name".
    head = (raw_id or "").split("/")[0].strip().lower()
    return head or "unknown"


# ---------------------------------------------------------------------------
# Distill / fine-tune exclusion per TRD §5.3
# ---------------------------------------------------------------------------

DERIVATIVE_SUFFIXES = (
    "-ft", "-distill", "-distilled",
    "-abliterated", "-uncensored",
)


def looks_like_derivative(name: str, tags: list[str]) -> tuple[bool, str | None]:
    """Return (is_derivative, reason). instruct variants are NOT excluded."""
    n = (name or "").lower()
    for suf in DERIVATIVE_SUFFIXES:
        if n.endswith(suf):
            return True, f"name suffix '{suf}'"
    if any(t.lower().startswith("base_model:") for t in tags or []):
        return True, "has base_model tag (derivative)"
    return False, None


# ---------------------------------------------------------------------------
# Process a single source
# ---------------------------------------------------------------------------

def process_source(
    source: str,
    raw_records: list[dict],
    idx: CanonicalIndex,
    stats: RunStats,
    *,
    threshold: float = DEFAULT_THRESHOLD,
) -> dict:
    """Classify raw records into matched / new / skipped."""
    out = {"matched": [], "new": [], "skipped": []}
    for rec in raw_records:
        raw_id = rec.get("id") or rec.get("model_name") or rec.get("model_id") or ""
        name = rec.get("name") or rec.get("model_name") or raw_id
        tags = rec.get("tags") or []

        is_deriv, reason = looks_like_derivative(name, tags)
        if is_deriv:
            out["skipped"].append({"source": source, "raw_id": raw_id, "name": name, "reason": reason})
            continue

        result = resolve(
            candidate=name,
            canonical=idx.by_name,
            aliases=idx.aliases,
            threshold=threshold,
        )
        if result.matched:
            out["matched"].append({
                "source": source,
                "raw_id": raw_id,
                "canonical_name": result.canonical_name,
                "matched_as_alias": result.matched_as_alias,
                "confidence": round(result.confidence, 4),
            })
            stats.matched_to_existing += 1
        else:
            out["new"].append({
                "source": source,
                "raw_id": raw_id,
                "name": name,
                "vendor": vendor_key_for(source, raw_id, name),
                "normalized": result.normalized,
            })
            stats.new_models_found += 1
    return out


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def load_latest_raw(source: str) -> list[dict]:
    """Return the most recent raw snapshot for a source, or [] if none."""
    src_dir = DATA_RAW / source
    if not src_dir.exists():
        return []
    files = sorted(src_dir.glob("*.json"), reverse=True)
    if not files:
        return []
    return read_json(files[0])


def main() -> int:
    configure_logging()
    stats = RunStats(source="normalize")
    idx = CanonicalIndex.load(CANONICAL_PATH)

    aggregated = {"matched": [], "new": [], "skipped": []}
    sources_processed: list[str] = []
    for source in ("openrouter", "huggingface"):
        records = load_latest_raw(source)
        if not records:
            continue
        try:
            cls = process_source(source, records, idx, stats)
            for k in aggregated:
                aggregated[k].extend(cls[k])
            sources_processed.append(source)
        except Exception as e:
            stats.add_error(f"{source}: {type(e).__name__}: {e}")

    # Persist normalized output.
    out_dir = DATA_PROCESSED / date.today().isoformat()
    write_json(out_dir / "normalized.json", {
        "produced_at": now(),
        "sources": sources_processed,
        **aggregated,
    })
    write_json(DATA_PROCESSED / "alias_index.json", {
        "aliases": idx.aliases,
        "canonical": {k: v for k, v in idx.by_name.items()},
        "canonical_to_company": idx.canonical_to_company,
        "companies": idx.companies,
    })

    log = __import__("logging").getLogger("pipeline")
    log.info("normalize: matched=%d new=%d skipped=%d",
             stats.matched_to_existing, stats.new_models_found, len(aggregated["skipped"]))
    cli_summary(aggregated["new"], "new candidate models")
    cli_summary(aggregated["skipped"], "skipped (derivative)")

    write_run(stats)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())