"""
LMArena fetcher (via official Hugging Face dataset lmarena-ai/leaderboard-dataset).

Pulls direct parquet files from HF datasets repo for fast, rate-limit-free retrieval.
"""
from __future__ import annotations

import io
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

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

DATASET_REPO = "https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset/resolve/main"
CONFIGS = ["text", "vision", "agent", "webdev"]
SOURCE_URL = "https://lmarena.ai"


def fetch() -> list[dict]:
    """Fetch Arena leaderboard snapshot from lmarena-ai/leaderboard-dataset on HF via Parquet."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    out: list[dict] = []
    seen_models: set[str] = set()
    log = __import__("logging").getLogger("pipeline")

    import pandas as pd

    for config_name in CONFIGS:
        parquet_url = f"{DATASET_REPO}/{config_name}/latest-00000-of-00001.parquet"
        try:
            raw_bytes = http_get(parquet_url)
            df = pd.read_parquet(io.BytesIO(raw_bytes))
            for _, row in df.iterrows():
                name = row.get("model_name") or row.get("name")
                score = row.get("rating") or row.get("score") or row.get("elo")
                if not name or score is None or (isinstance(score, float) and score != score):
                    continue

                key = f"{name}:{config_name}"
                if key in seen_models:
                    continue
                seen_models.add(key)

                bench_name = "Arena-ELO" if config_name == "text" else f"Arena-ELO-{config_name.title()}"
                out.append({
                    "model_name": str(name),
                    "benchmark_name": bench_name,
                    "score": round(float(score), 2),
                    "rank": float(row.get("rank", 0)) if row.get("rank") is not None else None,
                    "category": str(row.get("category", "")),
                    "organization": str(row.get("organization", "")),
                    "source": "lmarena-hf",
                    "source_url": SOURCE_URL,
                    "fetched_at": now,
                })
        except Exception as e:
            log.warning("failed fetching parquet for config %s (%s)", config_name, e)
            continue

    if not out:
        raise RuntimeError("No arena records could be fetched from lmarena-ai/leaderboard-dataset parquet")
    return out


def main() -> int:
    configure_logging()
    stats = RunStats(source="arena")
    try:
        records = fetch()
        path = raw_snapshot_path("arena")
        write_json(path, records)
        log = __import__("logging").getLogger("pipeline")
        log.info("wrote %d arena rows to %s", len(records), path)
        stats.matched_to_existing = len(records)
    except Exception as e:
        stats.add_error(f"{type(e).__name__}: {e}")
        write_run(stats)
        return 0
    write_run(stats)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())