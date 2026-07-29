"""
HF Open LLM Leaderboard fetcher.

Source dataset: open-llm-leaderboard/results on Hugging Face.

We pull the parquet results file directly via the Hub's REST API rather than
loading the whole `datasets` library — same data, much smaller install.

Output schema (one element per model result row):
    {
      "model_id": "Qwen/Qwen2.5-72B-Instruct",
      "benchmark_name": "IFEval",
      "score": 0.741,
      "fetched_at": "...",
      "source": "hf-leaderboard",
      "source_url": "https://huggingface.co/spaces/open-llm-leaderboard/..."
    }
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib import (
    RunStats,
    configure_logging,
    fetch_json,
    http_get,
    raw_snapshot_path,
    write_json,
    write_run,
)


# Direct parquet URLs from the leaderboard results dataset. We pick the latest
# "results_*.parquet" file via the dataset listing API to avoid hard-coding a
# filename that gets rotated.
DATASET_API = "https://huggingface.co/api/datasets/open-llm-leaderboard/results/tree/main"

# Columns that contain benchmark scores in the parquet schema.
BENCHMARK_COLUMNS = [
    "IFEval",
    "BBH",
    "MATH",
    "GPQA",
    "MUSR",
    "MMLU-Pro",
]


def fetch_parquet_url() -> str | None:
    """Pick the latest results parquet from the dataset tree.

    Note: the dataset is organized as <author>/<model>/results*.parquet rather
    than a single top-level file. We therefore skip the parquet fast-path and
    fall back to the rows API below. (See TRD §5.4 — benchmarks pending is
    expected, not an error.)
    """
    try:
        tree = fetch_json(DATASET_API)
    except Exception:
        return None
    candidates = [
        f.get("path", "")
        for f in tree
        if f.get("type") == "file" and f.get("path", "").endswith(".parquet")
    ]
    # Prefer a top-level "results*.parquet" if one exists in future snapshots.
    candidates = [c for c in candidates if "/" not in c and c.startswith("results") and "raw_" not in c]
    if not candidates:
        return None
    candidates.sort()
    return f"https://huggingface.co/datasets/open-llm-leaderboard/results/resolve/main/{candidates[-1]}"


def fetch_via_dataset_api() -> list[dict]:
    """Fallback: use the dataset's row-level API endpoint (slow for full sweep).

    The HF Datasets server exposes a /rows endpoint that returns paginated JSON.
    We sample the first page only as a smoke signal — the parquet path is the
    authoritative fetcher in production.
    """
    # The dataset is organized as <author>/<model>/…; the viewer API needs a
    # specific config/split. We try the most common canonical one.
    urls = [
        "https://datasets-server.huggingface.co/rows?dataset=open-llm-leaderboard%2Fresults&config=default&split=train&offset=0&length=100",
        "https://datasets-server.huggingface.co/rows?dataset=open-llm-leaderboard%2Fresults&config=results&split=train&offset=0&length=100",
    ]
    for url in urls:
        try:
            payload = fetch_json(url)
            return payload.get("rows", [])
        except Exception:
            continue
    return []


def fetch() -> list[dict]:
    """Fetch and normalize leaderboard results. Returns list of score rows."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    parquet_url = fetch_parquet_url()
    if not parquet_url:
        log = __import__("logging").getLogger("pipeline")
        log.warning("no parquet found, falling back to rows API (partial)")
        return [_normalize_row(r, now) for r in fetch_via_dataset_api()]

    raw = http_get(parquet_url)
    # Lazy-import pandas + pyarrow so the pipeline doesn't require them unless
    # the leaderboard fetcher is actually invoked (graceful degradation).
    try:
        import io
        import pandas as pd
    except ImportError as e:
        log = __import__("logging").getLogger("pipeline")
        log.error("pandas/pyarrow required for leaderboard parsing: %s", e)
        return []

    df = pd.read_parquet(io.BytesIO(raw))
    out: list[dict] = []
    cols = [c for c in BENCHMARK_COLUMNS if c in df.columns]
    if not cols:
        return []
    for _, row in df.iterrows():
        model_id = row.get("model_id") or row.get("model") or row.get("name")
        if not model_id:
            continue
        for col in cols:
            score = row.get(col)
            if score is None or (isinstance(score, float) and score != score):
                continue
            out.append({
                "model_id": model_id,
                "benchmark_name": col,
                "score": float(score),
                "source": "hf-leaderboard",
                "source_url": (
                    "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard"
                ),
                "fetched_at": now,
            })
    return out


def _normalize_row(row: dict, now: str) -> dict:
    """Normalize a /rows API response row."""
    row_obj = row.get("row", row) if isinstance(row, dict) else {}
    out = []
    model_id = row_obj.get("model_id") or row_obj.get("model")
    if not model_id:
        return {}
    for col in BENCHMARK_COLUMNS:
        if col in row_obj and row_obj[col] is not None:
            out.append({
                "model_id": model_id,
                "benchmark_name": col,
                "score": float(row_obj[col]),
                "source": "hf-leaderboard",
                "source_url": (
                    "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard"
                ),
                "fetched_at": now,
            })
    return {"_bundle": out}


def main() -> int:
    configure_logging()
    stats = RunStats(source="leaderboard")
    try:
        records = fetch()
        # Flatten any bundle rows from the rows-API fallback path.
        flat: list[dict] = []
        for r in records:
            if "_bundle" in r:
                flat.extend(r["_bundle"])
            else:
                flat.append(r)
        path = raw_snapshot_path("leaderboard")
        write_json(path, flat)
        log = __import__("logging").getLogger("pipeline")
        log.info("wrote %d benchmark rows to %s", len(flat), path)
        stats.matched_to_existing = len(flat)
    except Exception as e:
        stats.add_error(f"{type(e).__name__}: {e}")
        write_run(stats)
        return 1
    write_run(stats)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())