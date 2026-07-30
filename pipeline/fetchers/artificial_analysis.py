"""
Artificial Analysis API fetcher (Free API v2).

Fetches official benchmarks, evaluations (Intelligence Index, Coding, Math, MMLU-Pro, GPQA),
speed (median_output_tokens_per_second), and pricing.

Requires ARTIFICIAL_ANALYSIS_API_KEY or AA_API_KEY environment variable.
Header format: x-api-key: <key>
Attribution required: https://artificialanalysis.ai/
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib import (
    RunStats,
    configure_logging,
    raw_snapshot_path,
    write_json,
    write_run,
)

V2_LLM_ENDPOINT = "https://artificialanalysis.ai/api/v2/data/llms/models"


def fetch() -> list[dict]:
    api_key = os.getenv("ARTIFICIAL_ANALYSIS_API_KEY") or os.getenv("AA_API_KEY")
    log = __import__("logging").getLogger("pipeline")
    if not api_key:
        log.info("ARTIFICIAL_ANALYSIS_API_KEY not set. Skipping Artificial Analysis fetcher.")
        return []

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    out: list[dict] = []

    req = urllib.request.Request(
        V2_LLM_ENDPOINT,
        headers={
            "User-Agent": "llm-atlas-pipeline/0.1",
            "x-api-key": api_key,
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            payload = json.loads(resp.read())
            models = payload.get("data", [])
            for m in models:
                if not isinstance(m, dict):
                    continue
                name = m.get("name") or m.get("slug") or m.get("id")
                if not name:
                    continue

                evals = m.get("evaluations") or {}
                
                # Intelligence Index
                intel = evals.get("artificial_analysis_intelligence_index")
                if intel is not None:
                    out.append({
                        "model_name": name,
                        "benchmark_name": "Intelligence Index",
                        "score": float(intel),
                        "source": "artificial-analysis",
                        "source_url": "https://artificialanalysis.ai",
                        "fetched_at": now,
                    })

                # Coding Index
                coding = evals.get("artificial_analysis_coding_index")
                if coding is not None:
                    out.append({
                        "model_name": name,
                        "benchmark_name": "Coding Index",
                        "score": float(coding),
                        "source": "artificial-analysis",
                        "source_url": "https://artificialanalysis.ai",
                        "fetched_at": now,
                    })

                # Math Index
                math_idx = evals.get("artificial_analysis_math_index")
                if math_idx is not None:
                    out.append({
                        "model_name": name,
                        "benchmark_name": "Math Index",
                        "score": float(math_idx),
                        "source": "artificial-analysis",
                        "source_url": "https://artificialanalysis.ai",
                        "fetched_at": now,
                    })

                # MMLU Pro
                mmlu_pro = evals.get("mmlu_pro")
                if mmlu_pro is not None:
                    out.append({
                        "model_name": name,
                        "benchmark_name": "MMLU-Pro",
                        "score": float(mmlu_pro * 100 if mmlu_pro <= 1.0 else mmlu_pro),
                        "source": "artificial-analysis",
                        "source_url": "https://artificialanalysis.ai",
                        "fetched_at": now,
                    })

                # Output Speed (tok/s)
                speed = m.get("median_output_tokens_per_second")
                if speed is not None:
                    out.append({
                        "model_name": name,
                        "benchmark_name": "Output Speed (tok/s)",
                        "score": float(speed),
                        "source": "artificial-analysis",
                        "source_url": "https://artificialanalysis.ai",
                        "fetched_at": now,
                    })

    except Exception as e:
        log.warning("Artificial Analysis fetcher failed: %s", e)

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
