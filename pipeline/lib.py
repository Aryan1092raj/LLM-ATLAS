"""
Common pipeline utilities.

Implements the fetch → normalize → resolve → enrich → commit flow per
docs/TRD.md §5. Single source of truth for:
  - HTTP session with timeout + retries
  - Run-context that logs to pipeline_runs
  - Path conventions (data/raw/<source>/<date>.json, data/processed/data.json)
  - JSON read/write helpers with atomic commits
"""
from __future__ import annotations

import datetime as _dt
import json
import logging
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

log = logging.getLogger("pipeline")

ROOT = Path(__file__).resolve().parent.parent
DATA_RAW = ROOT / "data" / "raw"
DATA_PROCESSED = ROOT / "data" / "processed"
PIPELINE_LOG = DATA_PROCESSED / "pipeline_runs.jsonl"
PUBLIC_PIPELINE_LOG = ROOT / "public" / "pipeline_runs.jsonl"
# Canonical dataset lives in public/ (what the frontend serves) and is the
# source of truth. Pipeline writes back to it after enrichment.
CANONICAL_PATH = ROOT / "public" / "data.json"

USER_AGENT = "llm-atlas-pipeline/0.1 (+https://github.com/Devisri-B/LLM-Architectures)"
DEFAULT_TIMEOUT = 30


def today() -> str:
    return _dt.date.today().isoformat()


def now() -> str:
    return _dt.datetime.utcnow().isoformat(timespec="seconds") + "Z"


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------

def http_get(url: str, *, timeout: int = DEFAULT_TIMEOUT, retries: int = 3) -> bytes:
    """Fetch URL with retries + exponential backoff. Raises on final failure."""
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ConnectionError) as e:
            last_err = e
            wait = 2 ** attempt
            log.warning("GET %s failed (attempt %d/%d): %s. Retrying in %ds", url, attempt + 1, retries, e, wait)
            time.sleep(wait)
    raise RuntimeError(f"GET {url} failed after {retries} attempts: {last_err}")


def fetch_json(url: str, **kwargs) -> Any:
    raw = http_get(url, **kwargs)
    return json.loads(raw)


# ---------------------------------------------------------------------------
# Run context
# ---------------------------------------------------------------------------

@dataclass
class RunStats:
    source: str
    started_at: str = field(default_factory=now)
    finished_at: str | None = None
    new_models_found: int = 0
    matched_to_existing: int = 0
    errors: list[str] = field(default_factory=list)

    def add_error(self, msg: str) -> None:
        log.error("[%s] %s", self.source, msg)
        self.errors.append(msg)

    def to_dict(self) -> dict:
        return {
            "source": self.source,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "new_models_found": self.new_models_found,
            "matched_to_existing": self.matched_to_existing,
            "errors": self.errors,
        }


def write_run(stats: RunStats) -> None:
    """Append a run record to pipeline_runs.jsonl (one JSON object per line) and sync to public/."""
    stats.finished_at = now()
    DATA_PROCESSED.mkdir(parents=True, exist_ok=True)
    with PIPELINE_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(stats.to_dict(), ensure_ascii=False) + "\n")
    try:
        import shutil
        PUBLIC_PIPELINE_LOG.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(PIPELINE_LOG, PUBLIC_PIPELINE_LOG)
    except Exception as e:
        log.warning("failed to sync pipeline_runs.jsonl to public/: %s", e)
    log.info("run logged: %s (new=%d matched=%d errors=%d)",
             stats.source, stats.new_models_found, stats.matched_to_existing, len(stats.errors))


# ---------------------------------------------------------------------------
# JSON I/O
# ---------------------------------------------------------------------------

def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, path)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def raw_snapshot_path(source: str, date: str | None = None) -> Path:
    """Path for a per-source per-date raw snapshot, per TRD §5."""
    d = date or today()
    return DATA_RAW / source / f"{d}.json"


# ---------------------------------------------------------------------------
# Logging bootstrap
# ---------------------------------------------------------------------------

def configure_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)-7s %(name)s :: %(message)s",
        stream=sys.stderr,
    )


# ---------------------------------------------------------------------------
# CLI helpers
# ---------------------------------------------------------------------------

def cli_summary(items: Iterable[Any], label: str, limit: int = 5) -> None:
    items = list(items)
    log.info("%s: %d total", label, len(items))
    for x in items[:limit]:
        log.info("  · %s", x)
    if len(items) > limit:
        log.info("  … and %d more", len(items) - limit)