"""
Hugging Face Hub fetcher.

Source: https://huggingface.co/api/models?full=false&limit=…

Returns model metadata from the Hub listing API: model id, downloads, likes,
pipeline_tag, tags (including base_model), lastModified.

We deliberately use the REST endpoint rather than huggingface_hub Python lib
to keep the pipeline zero-dependency at install time (per TRD §6 — runtime is
Python; specific library choice isn't pinned to avoid coupling).

Output schema (one element per model):
    {
      "id": "meta-llama/Llama-3.1-70B-Instruct",
      "downloads": 12345,
      "likes": 200,
      "pipeline_tag": "text-generation",
      "tags": ["base_model:meta-llama/Llama-3.1-70B", ...],
      "last_modified": "2025-...",
      "fetched_at": "2026-07-29T00:00:00Z",
      "raw": { ... passthrough ... }
    }
"""
from __future__ import annotations

import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib import (
    RunStats,
    USER_AGENT,
    configure_logging,
    fetch_json,
    raw_snapshot_path,
    write_json,
    write_run,
)


BASE_URL = "https://huggingface.co/api/models"
# Filters to keep payload small and the catalog focused on real LLMs.
TEXT_GEN_ONLY = "text-generation"
MAX_PAGES = 30  # 30 × 100 = 3000 entries, more than enough for daily delta
PAGE_SIZE = 100

# Matches the cursor embedded in the `link: <…?cursor=…>; rel="next"` header.
LINK_NEXT_RE = re.compile(r'<([^>]+)>;\s*rel="next"')


def fetch_page_raw(*, cursor: str | None = None) -> tuple[list, str | None]:
    """Fetch one page; returns (models, next_cursor)."""
    url = f"{BASE_URL}?limit={PAGE_SIZE}&full=false&pipeline_tag={TEXT_GEN_ONLY}"
    if cursor:
        url += f"&cursor={cursor}"
    req = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=30) as resp:
        link = resp.headers.get("link", "")
        body = resp.read()
    next_cursor = None
    m = LINK_NEXT_RE.search(link)
    if m:
        # Extract cursor=... from the next URL.
        next_url = m.group(1)
        cm = re.search(r"cursor=([^&]+)", next_url)
        if cm:
            next_cursor = cm.group(1)
    import json as _json
    return _json.loads(body), next_cursor


def fetch_all() -> list[dict]:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    seen: list[dict] = []
    cursor: str | None = None
    for _ in range(MAX_PAGES):
        models, cursor = fetch_page_raw(cursor=cursor)
        if not models:
            break
        for m in models:
            seen.append(normalize(m, now))
        if not cursor:
            break
    return seen


def normalize(model: dict, now: str) -> dict:
    return {
        "id": model.get("id") or model.get("modelId"),
        "downloads": model.get("downloads"),
        "likes": model.get("likes"),
        "pipeline_tag": model.get("pipeline_tag"),
        "tags": model.get("tags") or [],
        "last_modified": model.get("lastModified") or model.get("createdAt"),
        "fetched_at": now,
        "raw": {
            "author": model.get("author"),
            "private": model.get("private"),
            "gated": model.get("gated"),
            "library_name": model.get("library_name"),
        },
    }


def main() -> int:
    configure_logging()
    stats = RunStats(source="huggingface")
    try:
        records = fetch_all()
        path = raw_snapshot_path("huggingface")
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