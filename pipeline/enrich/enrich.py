"""
Enrichment stage per TRD §5.4.

For each new candidate from normalize.py:
  1. Try to fetch Hugging Face `config.json` for the model.
  2. Classify into a family (dense / moe / hybrid_attention_ssm / looped /
     multimodal) from config fields and the candidate name.
  3. Decide disclosure:
       - open_weight if HF config.json was fetched
       - closed_undisclosed otherwise (e.g., discovered only via OpenRouter /
         Arena with no HF repo)
  4. Write a `pending_enrichment` record into data/processed/data.json,
     then promote `auto_added` → `enriched` (config known) → `complete`
     (also has ≥1 benchmark).
  5. For every model missing pricing or benchmarks, attempt to attach
     matching records from the leaderboard and arena raw snapshots.
  6. Log everything to pipeline_runs.jsonl.

Run:
    python -m pipeline.enrich
"""
from __future__ import annotations

import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib import (
    CANONICAL_PATH,
    DATA_PROCESSED,
    DATA_RAW,
    RunStats,
    configure_logging,
    http_get,
    now,
    read_json,
    write_json,
    write_run,
)
from resolve.normalize import normalize_name


# ---------------------------------------------------------------------------
# Family classification
# ---------------------------------------------------------------------------

def classify_family(name: str, config: dict | None, raw: dict | None) -> str:
    """Pick a family from name heuristics + config signals."""
    n = (name or "").lower()
    if config:
        mt = (config.get("model_type") or "").lower()
        if "mamba" in mt or "ssm" in mt:
            return "hybrid_attention_ssm"
        # MoE signals in config.
        if config.get("num_local_experts") or config.get("num_experts") or config.get("moe"):
            return "moe"
        if config.get("num_loops") and int(config.get("num_loops", 1)) > 1:
            return "looped"

    # Name-pattern fallbacks.
    if any(k in n for k in ("mixtral", "moe", "dbrx", "deepseek-v3", "deepseek v3", "deepseek-r1", "deepseek r1", "deepseek-v4", "deepseek v4")) or __import__("re").search(r'\d+b[_-]?a\d+b', n):
        if not any(k in n for k in ("lite", "tiny", "distill", "math-7b", "math-1.5b")):
            return "moe"
    if "mamba" in n or "falcon3-mamba" in n or "jamba" in n:
        return "hybrid_attention_ssm"
    if any(k in n for k in ("nanbeige", "rwkv")):
        return "looped" if "nanbeige" in n else "hybrid_attention_ssm"
    if any(k in n for k in ("gpt-4o", "claude", "gemini", "4o", "vision")):
        return "multimodal"
    if any(k in n for k in ("r1", "reasoning", "o1", "o3")):
        return "dense"
    return "dense"


# ---------------------------------------------------------------------------
# config.json fetch
# ---------------------------------------------------------------------------

def fetch_hf_config(model_id: str) -> dict | None:
    """Pull raw config.json from Hugging Face. Returns dict or None."""
    if not model_id or "/" not in model_id:
        return None
    url = f"https://huggingface.co/{model_id}/resolve/main/config.json"
    try:
        return json.loads(http_get(url, timeout=3, retries=1))
    except Exception:
        return None


def extract_specs(config: dict, fetched_at: str) -> dict:
    """Map HF config.json → our architecture_specs schema."""
    total = config.get("num_parameters") or config.get("n_params")
    active = total  # dense default; MoE handled below.
    num_experts = config.get("num_local_experts") or config.get("num_experts") or config.get("n_routed_experts")
    if num_experts:
        total = config.get("num_parameters") or (num_experts * config.get("num_experts_per_tok", 1) * 7_000_000_000)
        active_params = config.get("num_experts_per_tok", 2) * config.get("expert_hidden_size", 0) * 8
        active = active_params if active_params else None

    n_heads = config.get("num_attention_heads") or config.get("n_head")
    n_kv_heads = config.get("num_key_value_heads") or config.get("n_kv_head")
    rope = config.get("rope_theta")
    if rope is None and isinstance(config.get("rope_scaling"), dict):
        rope = config.get("rope_scaling", {}).get("factor")

    return {
        "disclosure": "open_weight",
        "params_total": total,
        "params_active": active,
        "model_type": config.get("model_type"),
        "attention_type": _attention_type(config, n_heads, n_kv_heads),
        "num_attention_heads": n_heads,
        "num_key_value_heads": n_kv_heads,
        "num_hidden_layers": config.get("num_hidden_layers") or config.get("n_layer"),
        "hidden_size": config.get("hidden_size") or config.get("d_model") or config.get("n_embd"),
        "num_local_experts": num_experts,
        "rope_theta": rope,
        "num_loops": config.get("num_loops"),
        "context_window": config.get("max_position_embeddings") or config.get("n_positions"),
        "tokenizer_vocab_size": config.get("vocab_size"),
        "license": config.get("license") or "Check repo",
        "source_url": f"https://huggingface.co/{config.get('_model_id', '')}",
        "fetched_at": fetched_at,
    }


def _attention_type(config: dict, n_heads: int | None = None, n_kv_heads: int | None = None) -> str | None:
    t = (config.get("model_type") or "").lower()
    if "mamba" in t or "ssm" in t:
        return "SSM"
    if "deepseek" in t or "mla" in t:
        return "MLA"
    if n_heads and n_kv_heads:
        if n_kv_heads == 1:
            return "MQA"
        if n_kv_heads < n_heads:
            return "GQA"
        if n_kv_heads == n_heads:
            return "MHA"
    if "llama" in t or "qwen" in t or "mistral" in t or "gemma" in t:
        return "GQA"
    return None


# ---------------------------------------------------------------------------
# Auto-add into canonical dataset
# ---------------------------------------------------------------------------

@dataclass
class NewModelDraft:
    raw_id: str
    name: str
    vendor: str
    source: str
    family: str
    disclosure: str
    specs: dict
    benchmarks: list[dict]
    pricing: list[dict]


OPEN_WEIGHT_VENDORS = {
    "meta", "meta-llama", "qwen", "mistral", "mistralai", "deepseek", "deepseek-ai",
    "google-open", "falcon", "tiiuae", "nanbeige", "microsoft",
    "01-ai", "nousresearch", "allenai", "bytedance", "bigcode", "stability", "rwkv"
}

OPEN_WEIGHT_KEYWORDS = [
    "llama", "qwen", "mistral", "mixtral", "deepseek", "gemma", "falcon",
    "phi-", "phi3", "phi4", "yi-", "starcoder", "hermes", "nanbeige", "rwkv", "mamba", "vicuna"
]

CLOSED_OVERRIDE_KEYWORDS = ["gpt-", "claude-", "gemini-1", "gemini-2", "o1-", "o3-", "glm-"]


def compute_confidence(disclosure: str, specs: dict, source_url: str | None = None) -> str:
    if disclosure == "open_weight" and (specs.get("num_hidden_layers") or specs.get("params_total")):
        return "verified"
    url = source_url or specs.get("source_url") or ""
    if url and "openrouter.ai" not in url:
        return "reported"
    return "undisclosed"


def is_open_weight_model(raw_id: str, name: str, vendor: str) -> bool:
    rid = (raw_id or "").lower()
    nm = (name or "").lower()
    v = (vendor or "").lower()
    if any(c in rid or c in nm for c in CLOSED_OVERRIDE_KEYWORDS) and not any(k in rid or k in nm for k in ("llama", "gemma", "qwen", "deepseek", "mistral")):
        return False
    return v in OPEN_WEIGHT_VENDORS or any(k in rid or k in nm for k in OPEN_WEIGHT_KEYWORDS)


def build_draft(candidate: dict, idx_data: dict) -> NewModelDraft:
    raw_id = candidate["raw_id"]
    name = candidate["name"]
    vendor = candidate.get("vendor") or "unknown"
    fetched_at = now()

    # 1. Try HF config.json (open-weight fast-path).
    config = fetch_hf_config(raw_id) if "/" in raw_id else None
    if config is not None:
        config["_model_id"] = raw_id
        specs = extract_specs(config, fetched_at)
        disclosure = "open_weight"
    elif is_open_weight_model(raw_id, name, vendor):
        specs = {
            "disclosure": "open_weight",
            "context_window": None,
            "license": "Open Source / Check Repo",
            "fetched_at": fetched_at,
        }
        disclosure = "open_weight"
    else:
        specs = {
            "disclosure": "closed_undisclosed",
            "context_window": None,
            "license": "Proprietary (API)" if "openrouter" in candidate["source"] else "Unknown",
            "fetched_at": fetched_at,
        }
        disclosure = "closed_undisclosed"

    family = classify_family(name, config, candidate)

    return NewModelDraft(
        raw_id=raw_id,
        name=name,
        vendor=vendor,
        source=candidate["source"],
        family=family,
        disclosure=disclosure,
        specs=specs,
        benchmarks=_attach_benchmarks(raw_id, name, fetched_at),
        pricing=_attach_pricing(raw_id, fetched_at),
    )


def _attach_benchmarks(raw_id: str, name: str, fetched_at: str) -> list[dict]:
    out: list[dict] = []
    seen_lb = load_latest_raw("leaderboard")
    seen_ar = load_latest_raw("arena")
    norm_targets = {normalize_name(raw_id), normalize_name(name)}

    for b in seen_lb:
        if normalize_name(b.get("model_id", "")) in norm_targets:
            out.append(_clean_bench(b))
    for b in seen_ar:
        if normalize_name(b.get("model_name", "")) in norm_targets:
            out.append(_clean_bench(b))
    return out


def _attach_pricing(raw_id: str, fetched_at: str) -> list[dict]:
    out: list[dict] = []
    seen_or = load_latest_raw("openrouter")
    if not seen_or:
        return out
    norm = normalize_name(raw_id)
    for r in seen_or:
        if normalize_name(r.get("id", "")) == norm:
            p_in = r.get("pricing_prompt_per_m")
            p_out = r.get("pricing_completion_per_m")
            if p_in is None and p_out is None:
                continue
            out.append({
                "provider": "openrouter",
                "input_price_per_m": p_in,
                "output_price_per_m": p_out,
                "fetched_at": r.get("fetched_at") or fetched_at,
            })
            break
    return out


def _clean_bench(b: dict) -> dict:
    return {
        "benchmark_name": b.get("benchmark_name"),
        "score": b.get("score"),
        "source": b.get("source"),
        "source_url": b.get("source_url"),
        "fetched_at": b.get("fetched_at") or now(),
    }


def load_latest_raw(source: str) -> list[dict]:
    src_dir = DATA_RAW / source
    if not src_dir.exists():
        return []
    files = sorted(src_dir.glob("*.json"), reverse=True)
    return read_json(files[0]) if files else []


def load_normalized() -> dict:
    p = DATA_PROCESSED / date.today().isoformat() / "normalized.json"
    if not p.exists():
        # Fall back to the most recent normalized snapshot.
        roots = sorted([d for d in DATA_PROCESSED.iterdir() if d.is_dir()], reverse=True)
        for r in roots:
            cand = r / "normalized.json"
            if cand.exists():
                return read_json(cand)
        return {"matched": [], "new": [], "skipped": []}
    return read_json(p)


def _status(draft: NewModelDraft) -> str:
    has_arch = draft.specs.get("num_hidden_layers") or draft.specs.get("params_total")
    has_bench = bool(draft.benchmarks)
    if has_arch and has_bench:
        return "complete"
    if has_arch:
        return "enriched"
    return "auto_added"


def _ensure_company(idx_data: dict, vendor_key: str, vendor_label: str) -> str:
    companies = idx_data.setdefault("companies", {})
    if vendor_key in companies:
        return vendor_key
    companies[vendor_key] = {
        "name": vendor_label,
        "image": "./images/all_models.png",
        "models": [],
    }
    return vendor_key


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def main() -> int:
    configure_logging()
    stats = RunStats(source="enrich")

    canonical = read_json(CANONICAL_PATH) if CANONICAL_PATH.exists() else {
        "schema_version": 1,
        "last_updated": now(),
        "sources": {},
        "families": ["dense", "moe", "hybrid_attention_ssm", "looped", "multimodal"],
        "companies": {},
    }
    new_candidates = load_normalized().get("new", [])

    log = __import__("logging").getLogger("pipeline")
    log.info("enrich: %d candidates to process", len(new_candidates))

    added = 0
    skipped_ghost = 0

    from concurrent.futures import ThreadPoolExecutor

    def process_cand(cand: dict) -> tuple[dict, NewModelDraft | None, Exception | None]:
        try:
            draft = build_draft(cand, canonical)
            return cand, draft, None
        except Exception as e:
            return cand, None, e

    with ThreadPoolExecutor(max_workers=20) as pool:
        results = list(pool.map(process_cand, new_candidates))

    for cand, draft, err in results:
        if err:
            stats.add_error(f"{cand.get('raw_id')}: {type(err).__name__}: {err}")
            continue
        if not draft:
            continue

        has_arch = draft.disclosure == "open_weight" and (
            draft.specs.get("num_hidden_layers") or draft.specs.get("params_total")
        )
        has_data = has_arch or bool(draft.pricing) or bool(draft.benchmarks)
        if not has_data:
            skipped_ghost += 1
            continue

        vendor_key = cand.get("vendor") or "unknown"
        vendor_label = vendor_key.title()
        ck = _ensure_company(canonical, vendor_key, vendor_label)
        model_id = draft.raw_id or f"{vendor_key}/{normalize_name(draft.name)}"
        conf = compute_confidence(draft.disclosure, draft.specs, draft.specs.get("source_url"))
        model = {
            "id": model_id,
            "name": draft.name,
            "family": draft.family,
            "disclosure": draft.disclosure,
            "confidence": conf,
            "status": _status(draft),
            "aliases": [draft.raw_id, draft.name],
            "features": {"Developer": vendor_label},
            "architecture_specs": draft.specs,
            "benchmarks": draft.benchmarks,
            "pricing": draft.pricing,
            "why": f"Auto-added by ingestion pipeline from {draft.source}.",
            "_added_at": now(),
            "_added_from": draft.source,
        }
        # De-dupe by id.
        if any(m.get("id") == model_id for m in canonical["companies"][ck]["models"]):
            continue
        canonical["companies"][ck]["models"].append(model)
        added += 1

    canonical["last_updated"] = now()
    write_json(CANONICAL_PATH, canonical)

    log.info("enrich: added %d new models to canonical dataset", added)
    stats.new_models_found = added
    write_run(stats)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())