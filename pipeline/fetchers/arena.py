"""
LMArena fetcher (via sanctioned mirror, per TRD §7).

The mirror at api.wulong.dev exposes JSON snapshots of LMArena rankings.
Per TRD §7 we do NOT scrape lmarena.ai directly — only the JSON mirror
(which is published under open-llm-leaderboards) is sanctioned.

Endpoint shape (best-effort; we don't pin specific query params because
the mirror may rotate them):
    GET https://api.wulong.dev/...

We try a small list of known-good paths and take whichever returns 200.
"""
from __future__ import annotations

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


CANDIDATE_PATHS = [
    "https://api.wulong.dev/arena",
    "https://api.wulong.dev/leaderboard",
    "https://api.wulong.dev/v1/leaderboard",
]


SOURCE_URL = "https://lmarena.ai"


def fetch() -> list[dict]:
    """Fetch Arena leaderboard snapshot. Returns normalized list of model rows."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    payload = None
    last_err: Exception | None = None
    for url in CANDIDATE_PATHS:
        try:
            payload = fetch_json(url)
            if payload:
                break
        except Exception as e:
            last_err = e
            continue
    if payload is None:
        raise RuntimeError(f"arena mirror unreachable ({last_err})")

    rows = _extract_rows(payload)
    out: list[dict] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        name = row.get("model_name") or row.get("name") or row.get("model")
        score = row.get("score") or row.get("elo") or row.get("rating")
        if not name or score is None:
            continue
        out.append({
            "model_name": name,
            "benchmark_name": "Arena-ELO",
            "score": float(score),
            "source": "arena-mirror",
            "source_url": SOURCE_URL,
            "fetched_at": now,
        })
    return out


def _extract_rows(payload: Any) -> list[Any]:
    """Tolerant shape detection — mirror schemas vary by snapshot."""
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("data", "leaderboard", "models", "rows", "results"):
            if key in payload and isinstance(payload[key], list):
                return payload[key]
        # Some mirrors wrap rows as a dict keyed by model name.
        first = next(iter(payload.values()), None)
        if isinstance(first, list):
            return first
    return []


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
        # Optional mirror unavailability should not fail the overall pipeline cron job
        return 0
    write_run(stats)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())