"""
Pipeline orchestrator.

Runs each fetcher, then normalize, then enrich, in sequence. Designed to be
the single entry point for the GitHub Actions cron job.

Run:
    python -m pipeline.run
"""
from __future__ import annotations

import sys
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib import configure_logging, log  # type: ignore  # log imported via module

from fetchers import arena, huggingface, leaderboard, openrouter  # noqa: F401
import normalize
import enrich.enrich as enrich_mod


FETCHERS = [
    ("openrouter", openrouter.main),
    ("huggingface", huggingface.main),
    ("leaderboard", leaderboard.main),
    ("arena", arena.main),
]


def main() -> int:
    configure_logging()
    rc = 0

    for name, fn in FETCHERS:
        log.info("=" * 60)
        log.info("fetcher: %s", name)
        log.info("=" * 60)
        try:
            fn()
        except SystemExit as e:
            if e.code:
                log.warning("fetcher %s exited non-zero (%s)", name, e.code)
                rc = rc or int(e.code)
        except Exception:
            log.error("fetcher %s crashed:\n%s", name, traceback.format_exc())
            rc = 1

    log.info("=" * 60)
    log.info("normalize")
    log.info("=" * 60)
    try:
        normalize.main()
    except SystemExit as e:
        rc = rc or int(e.code or 0)
    except Exception:
        log.error("normalize crashed:\n%s", traceback.format_exc())
        rc = 1

    log.info("=" * 60)
    log.info("enrich")
    log.info("=" * 60)
    try:
        enrich_mod.main()
    except SystemExit as e:
        rc = rc or int(e.code or 0)
    except Exception:
        log.error("enrich crashed:\n%s", traceback.format_exc())
        rc = 1

    log.info("pipeline complete (rc=%d)", rc)
    return rc


if __name__ == "__main__":
    raise SystemExit(main())