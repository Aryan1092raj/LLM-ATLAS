"""
Artificial Analysis API fetcher.

Provides live Intelligence Index, speed, latency, and pricing data per model.
Requires ARTIFICIAL_ANALYSIS_API_KEY or AA_API_KEY environment variable.
If missing or unauthenticated, logs a warning and exits gracefully.
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib import (
    RunStats,
    configure_logging,
    http_get,
    raw_snapshot_path,
    write_json,
    write_run,
)

ENDPOINT_URLS = [
    "https://api.artificialanalysis.ai/v1/metrics",
    "https://api.artificialanalysis.ai/v1/data",
    "https://api.artificialanalysis.ai/v1/models",
]


def fetch() -> list[dict]:
    api_key = os.getenv("ARTIFICIAL_ANALYSIS_API_KEY") or os.getenv("AA_API_KEY")
    log = __import__("logging").getLogger("pipeline")
    if not api_key:
        log.info("ARTIFICIAL_ANALYSIS_API_KEY not set. Skipping Artificial Analysis fetcher.")
        return []

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    out: list[dict] = []
    
    import urllib.request
    for url in ENDPOINT_URLS:
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "llm-atlas-pipeline/0.1",
                    "x-api-key": api_key,
                    "Authorization": f"Bearer {api_key}",
                }
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
                models = data.get("data") or data.get("models") or (data if isinstance(data, list) else [])
                for m in models:
                    if not isinstance(m, dict):
                        continue
                    name = m.get("model_name") or m.get("name") or m.get("id")
                    if not name:
                        continue
                    
                    # Intelligence Index
                    if "intelligence_index" in m or "quality_index" in m:
                        score = m.get("intelligence_index") or m.get("quality_index")
                        if score is not None:
                            out.append({
                                "model_name": name,
                                "benchmark_name": "Intelligence Index",
                                "score": float(score),
                                "source": "artificial-analysis",
                                "source_url": "https://artificialanalysis.ai",
                                "fetched_at": now,
                            })
                    
                    # Output speed (tokens/sec)
                    if "output_speed" in m or "tokens_per_second" in m:
                        speed = m.get("output_speed") or m.get("tokens_per_second")
                        if speed is not None:
                            out.append({
                                "model_name": name,
                                "benchmark_name": "Output Speed (tok/s)",
                                "score": float(speed),
                                "source": "artificial-analysis",
                                "source_url": "https://artificialanalysis.ai",
                                "fetched_at": now,
                            })
                if out:
                    break
        except Exception as e:
            log.warning("Artificial Analysis request to %s failed: %s", url, e)
            continue

    return out


def main() -> int:
    configure_logging()
    stats = RunStats(source="artificial_analysis")
    try:
        records = fetch()
        path = raw_snapshot_path("artificial_analysis")
        write_json(path, records)
        log = __import__("logging").getLogger("pipeline")
        log.info("wrote %d artificial analysis rows to %s", len(records), path)
        stats.matched_to_existing = len(records)
    except Exception as e:
        stats.add_error(f"{type(e).__name__}: {e}")
        write_run(stats)
        return 0
    write_run(stats)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
