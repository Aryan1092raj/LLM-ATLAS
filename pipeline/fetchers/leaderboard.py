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
DATASET_API = "https://huggingface.co/api/datasets/open-llm-leaderboard/contents/tree/main/data"

BENCHMARK_COLUMNS = [
    "IFEval",
    "BBH",
    "MATH",
    "MATH Lvl 5",
    "GPQA",
    "MUSR",
    "MMLU-Pro",
    "MMLU-PRO",
]

PARQUET_FALLBACK_URL = "https://huggingface.co/datasets/open-llm-leaderboard/contents/resolve/main/data/train-00000-of-00001.parquet"


def fetch_parquet_url() -> str | None:
    """Pick parquet file from open-llm-leaderboard dataset or return fallback."""
    try:
        tree = fetch_json(DATASET_API)
        candidates = [
            f.get("path", "")
            for f in tree
            if f.get("type") == "file" and f.get("path", "").endswith(".parquet")
        ]
        if candidates:
            return f"https://huggingface.co/datasets/open-llm-leaderboard/contents/resolve/main/{candidates[0]}"
    except Exception:
        pass
    return PARQUET_FALLBACK_URL


def fetch_via_dataset_api() -> list[dict]:
    """Fallback: use HF Datasets server rows API endpoint."""
    urls = [
        "https://datasets-server.huggingface.co/rows?dataset=open-llm-leaderboard%2Fcontents&config=default&split=train&offset=0&length=100",
        "https://datasets-server.huggingface.co/rows?dataset=open-llm-leaderboard%2Fresults&config=default&split=train&offset=0&length=100",
    ]
    for url in urls:
        try:
            payload = fetch_json(url)
            if payload and "rows" in payload:
                return payload["rows"]
        except Exception:
            continue
    return []


def fetch() -> list[dict]:
    """Fetch and normalize leaderboard results. Returns list of score rows."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    parquet_url = fetch_parquet_url()
    log = __import__("logging").getLogger("pipeline")

    if parquet_url:
        try:
            raw = http_get(parquet_url)
            import io
            import pandas as pd
            df = pd.read_parquet(io.BytesIO(raw))
            out: list[dict] = []
            cols = [c for c in BENCHMARK_COLUMNS if c in df.columns]
            if cols:
                for _, row in df.iterrows():
                    model_id = row.get("fullname") or row.get("Model") or row.get("model_id") or row.get("model") or row.get("name")
                    if not model_id:
                        continue
                    for col in cols:
                        score = row.get(col)
                        if score is None or (isinstance(score, float) and score != score):
                            continue
                        bench_name = "MMLU-Pro" if col == "MMLU-PRO" else ("MATH" if col == "MATH Lvl 5" else col)
                        out.append({
                            "model_id": str(model_id),
                            "benchmark_name": bench_name,
                            "score": float(score),
                            "source": "hf-leaderboard",
                            "source_url": "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard",
                            "fetched_at": now,
                        })
                if out:
                    return out
        except Exception as e:
            log.warning("parquet parsing failed (%s), falling back to rows API", e)

    log.warning("falling back to rows API")
    return [_normalize_row(r, now) for r in fetch_via_dataset_api()]


def _normalize_row(row: dict, now: str) -> dict:
    """Normalize a /rows API response row."""
    row_obj = row.get("row", row) if isinstance(row, dict) else {}
    out = []
    model_id = row_obj.get("fullname") or row_obj.get("Model") or row_obj.get("model_id") or row_obj.get("model")
    if not model_id:
        return {}
    for col in BENCHMARK_COLUMNS:
        if col in row_obj and row_obj[col] is not None:
            bench_name = "MMLU-Pro" if col == "MMLU-PRO" else ("MATH" if col == "MATH Lvl 5" else col)
            try:
                out.append({
                    "model_id": str(model_id),
                    "benchmark_name": bench_name,
                    "score": float(row_obj[col]),
                    "source": "hf-leaderboard",
                    "source_url": "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard",
                    "fetched_at": now,
                })
            except (ValueError, TypeError):
                continue
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