"""
OpenRouter fetcher.

Endpoint: https://openrouter.ai/api/v1/models

Returns the full model catalog with per-model pricing (prompt/completion in
USD per 1M tokens), context window, provider list, and a canonical id.

Per TRD §3: free, no auth required for model list; daily cadence.

Output schema (one element per model):
    {
      "id": "openai/gpt-4o",
      "name": "GPT-4o",
      "context_window": 128000,
      "pricing_prompt_per_m": 2.5,
      "pricing_completion_per_m": 10.0,
      "provider": "openrouter",
      "fetched_at": "2026-07-29T00:00:00Z"
    }
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib import (
    DATA_RAW,
    RunStats,
    configure_logging,
    fetch_json,
    raw_snapshot_path,
    write_run,
)


URL = "https://openrouter.ai/api/v1/models"


def normalize(model: dict, now: str) -> dict:
    pricing = model.get("pricing") or {}
    # OpenRouter exposes prices as USD per token; convert to USD per 1M tokens.
    p_in = _to_per_million(pricing.get("prompt"))
    p_out = _to_per_million(pricing.get("completion"))
    arch = model.get("architecture") or {}
    return {
        "id": model.get("id") or model.get("slug"),
        "name": model.get("name") or model.get("id"),
        "context_window": arch.get("input_modalities") and model.get("top_provider", {}).get("max_completion_tokens"),
        "modality": arch.get("input_modalities"),
        "pricing_prompt_per_m": p_in,
        "pricing_completion_per_m": p_out,
        "provider": "openrouter",
        "raw": {
            "id": model.get("id"),
            "created": model.get("created"),
            "context_length": model.get("context_length"),
            "hugging_face_id": model.get("hugging_face_id"),
            "per_request_limits": model.get("per_request_limits"),
        },
        "fetched_at": now,
    }


def _to_per_million(per_token: str | float | None) -> float | None:
    if per_token is None:
        return None
    try:
        return float(per_token) * 1_000_000
    except (TypeError, ValueError):
        return None


def fetch() -> list[dict]:
    """Fetch and normalize the OpenRouter catalog. Returns list of records."""
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    payload = fetch_json(URL)
    models = payload.get("data", payload) if isinstance(payload, dict) else payload
    return [normalize(m, now) for m in (models or [])]


def main() -> int:
    configure_logging()
    stats = RunStats(source="openrouter")
    try:
        records = fetch()
        path = raw_snapshot_path("openrouter")
        from lib import write_json
        write_json(path, records)
        log = __import__("logging").getLogger("pipeline")
        log.info("wrote %d models to %s", len(records), path)
        stats.matched_to_existing = len(records)
    except Exception as e:
        stats.add_error(f"{type(e).__name__}: {e}")
        write_run(stats)
        return 1
    write_run(stats)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())