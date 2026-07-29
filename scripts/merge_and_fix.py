#!/usr/bin/env python3
"""
Merge full build/data.json (399+ models) with curated seed-data,
fix company misclassifications (e.g. Gemma under OpenAI),
and write the final complete dataset to public/data.json and build/data.json.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

BUILD_DATA_PATH = ROOT / "build" / "data.json"
PUBLIC_DATA_PATH = ROOT / "public" / "data.json"

def get_true_company_key(model: dict, current_key: str) -> str:
    m_id = (model.get("id") or "").lower()
    name = (model.get("name") or "").lower()
    dev = (model.get("features", {}).get("Developer") or "").lower()
    aliases = [a.lower() for a in model.get("aliases", [])]
    all_str = f"{m_id} {name} {dev} {' '.join(aliases)}"

    # Google / Gemma
    if "gemma" in all_str:
        return "google-open"
    if "gemini" in all_str or "google" in all_str:
        return "google"

    # OpenAI / GPT / o1 / o3
    if "openai" in all_str or "gpt" in all_str or "o1-" in all_str or "o3-" in all_str or m_id.startswith("openai/"):
        return "openai"

    # Anthropic / Claude
    if "anthropic" in all_str or "claude" in all_str or m_id.startswith("anthropic/"):
        return "anthropic"

    # Meta / Llama
    if "meta" in all_str or "llama" in all_str or m_id.startswith("meta-llama/") or m_id.startswith("meta/"):
        return "meta"

    # DeepSeek
    if "deepseek" in all_str or m_id.startswith("deepseek/") or m_id.startswith("deepseek-ai/"):
        return "deepseek"

    # Mistral / Mixtral / Codestral / Pixtral
    if "mistral" in all_str or "mixtral" in all_str or "codestral" in all_str or "pixtral" in all_str or m_id.startswith("mistralai/"):
        return "mistral"

    # Qwen / QwQ / Alibaba
    if "qwen" in all_str or "qwq" in all_str or "alibaba" in all_str or m_id.startswith("qwen/"):
        return "qwen"

    # Falcon / TII
    if "falcon" in all_str or m_id.startswith("tiiuae/"):
        return "falcon"

    # Microsoft / Phi
    if "microsoft" in all_str or "phi-" in all_str or m_id.startswith("microsoft/"):
        return "microsoft"

    # xAI / Grok
    if "grok" in all_str or "xai" in all_str or m_id.startswith("x-ai/") or m_id.startswith("xai/"):
        return "xai"

    # AI21 / Jamba
    if "jamba" in all_str or "ai21" in all_str or m_id.startswith("ai21/"):
        return "ai21"

    # Cohere / Command
    if "cohere" in all_str or "command-" in all_str or m_id.startswith("cohere/"):
        return "cohere"

    # Z-AI / GLM
    if "glm" in all_str or "z-ai" in all_str or m_id.startswith("z-ai/"):
        return "zai"

    # Nanbeige
    if "nanbeige" in all_str or m_id.startswith("nanbeige/"):
        return "nanbeige"

    return current_key or "other"

def main():
    if not BUILD_DATA_PATH.exists():
        print(f"ERROR: {BUILD_DATA_PATH} missing")
        return

    with open(BUILD_DATA_PATH, "r", encoding="utf-8") as f:
        build_data = json.load(f)

    # 1. Map all models by model ID
    model_map = {}
    
    # Process build models first
    for c_key, company in build_data.get("companies", {}).items():
        for m in company.get("models", []):
            m_id = m.get("id")
            if not m_id:
                continue
            true_ck = get_true_company_key(m, c_key)
            model_map[m_id] = (m.copy(), true_ck)

    # Overlay curated public/data.json models if present (preserves curated benchmarks/features/specs)
    if PUBLIC_DATA_PATH.exists():
        try:
            with open(PUBLIC_DATA_PATH, "r", encoding="utf-8") as f_pub:
                pub_data = json.load(f_pub)
            for c_key, company in pub_data.get("companies", {}).items():
                for m in company.get("models", []):
                    m_id = m.get("id")
                    if not m_id:
                        continue
                    true_ck = get_true_company_key(m, c_key)
                    if m_id in model_map:
                        existing_m, _ = model_map[m_id]
                        merged_m = {**existing_m, **m}
                        merged_m["features"] = {**existing_m.get("features", {}), **m.get("features", {})}
                        merged_m["architecture_specs"] = {**existing_m.get("architecture_specs", {}), **m.get("architecture_specs", {})}
                        merged_m["benchmarks"] = m.get("benchmarks") if m.get("benchmarks") else existing_m.get("benchmarks", [])
                        merged_m["pricing"] = m.get("pricing") if m.get("pricing") else existing_m.get("pricing", [])
                        merged_m["why"] = m.get("why") or existing_m.get("why", "")
                        model_map[m_id] = (merged_m, true_ck)
                    else:
                        model_map[m_id] = (m.copy(), true_ck)
        except Exception as e:
            print(f"Warning loading public/data.json overlay: {e}")

    print(f"Total base models from build/data.json: {len(model_map)}")

    # Standard company metadata map
    companies_meta = {
        "openai": {"name": "OpenAI", "image": "./images/gpt.png"},
        "anthropic": {"name": "Anthropic", "image": "./images/cluade.jpeg"},
        "google": {"name": "Google", "image": "./images/google.webp"},
        "google-open": {"name": "Google (Open)", "image": "./images/google.webp"},
        "meta": {"name": "Meta", "image": "./images/meta.png"},
        "deepseek": {"name": "DeepSeek", "image": "./images/deepseek.png"},
        "mistral": {"name": "Mistral AI", "image": "./images/meta.png"},
        "qwen": {"name": "Alibaba (Qwen)", "image": "./images/qwen1.png"},
        "falcon": {"name": "TII (Falcon)", "image": "./images/falcon.jpeg"},
        "microsoft": {"name": "Microsoft", "image": "./images/google.webp"},
        "xai": {"name": "xAI", "image": "./images/gpt.png"},
        "ai21": {"name": "AI21 Labs", "image": "./images/google.webp"},
        "cohere": {"name": "Cohere", "image": "./images/google.webp"},
        "nanbeige": {"name": "Nanbeige (looped)", "image": "./images/qwen1.png"},
        "zai": {"name": "Z-AI (GLM)", "image": "./images/qwen1.png"}
    }

    final_companies = {ck: {**meta, "models": []} for ck, meta in companies_meta.items()}

    # Group all models into final_companies
    gemma_fixed_count = 0
    for m_id, (m, true_ck) in model_map.items():
        if true_ck not in final_companies:
            final_companies[true_ck] = {
                "name": true_ck.replace("_", " ").title(),
                "image": "./images/gpt.png",
                "models": []
            }
        final_companies[true_ck]["models"].append(m)
        if "gemma" in m_id.lower() and true_ck == "google-open":
            gemma_fixed_count += 1

    total_final = sum(len(c["models"]) for c in final_companies.values())
    print(f"Total merged & categorized models: {total_final}")
    print(f"Gemma models correctly under Google (Open): {gemma_fixed_count}")

    # Remove empty company buckets
    final_companies = {k: v for k, v in final_companies.items() if len(v["models"]) > 0}

    final_data = {
        "schema_version": build_data.get("schema_version", 1),
        "last_updated": "2026-07-29",
        "sources": build_data.get("sources", {}),
        "families": build_data.get("families", ["dense", "moe", "hybrid_attention_ssm", "looped", "multimodal"]),
        "companies": final_companies
    }

    # Write out to public/data.json and build/data.json
    with open(PUBLIC_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(final_data, f, indent=2)
    print(f"Wrote {PUBLIC_DATA_PATH}")

    with open(BUILD_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(final_data, f, indent=2)
    print(f"Wrote {BUILD_DATA_PATH}")

if __name__ == "__main__":
    main()
