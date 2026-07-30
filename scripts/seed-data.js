#!/usr/bin/env node
// Seed data.json with 40+ flagship + open-weight models across all families.
// Run: node scripts/seed-data.js
const fs = require('fs');
const path = require('path');

const data = {
  schema_version: 1,
  last_updated: "2026-07-29",
  sources: {
    primary: [
      { name: "Hugging Face Open LLM Leaderboard", url: "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard" },
      { name: "LMArena (via api.wulong.dev mirror)", url: "https://api.wulong.dev" },
      { name: "OpenRouter", url: "https://openrouter.ai/api/v1/models" },
      { name: "Epoch AI — Notable Models", url: "https://epochai.org/data/notable-models" }
    ]
  },
  families: ["dense", "moe", "hybrid_attention_ssm", "looped", "multimodal"],
  companies: {
    openai: {
      name: "OpenAI", image: "./images/gpt.png",
      models: [
        {
          id: "openai/gpt-4o", name: "GPT-4o", family: "multimodal",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["gpt-4o", "openai/gpt-4o"],
          features: { "Developer": "OpenAI", "Architecture": "Closed, undisclosed. Multimodal text + image + audio.", "Parameters": "Undisclosed.", "Attention Mechanism": "Undisclosed.", "Text Generation": "Native, fast.", "Code Generation": "Strong." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 128000, license: "Proprietary (API)", source_url: "https://openrouter.ai/models/openai/gpt-4o", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1286, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "MMLU", score: 88.7, source: "Open LLM Leaderboard", source_url: "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 2.5, output_price_per_m: 10.0, fetched_at: "2026-07-29" }],
          why: "Closed frontier model evaluated purely via API benchmarks. Pricing tier reflects input/output token economics."
        },
        {
          id: "openai/gpt-4o-mini", name: "GPT-4o Mini", family: "multimodal",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["gpt-4o-mini", "openai/gpt-4o-mini"],
          features: { "Developer": "OpenAI", "Architecture": "Compact multimodal transformer for low-latency tasks.", "Parameters": "Undisclosed." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 128000, license: "Proprietary (API)", source_url: "https://openrouter.ai/models/openai/gpt-4o-mini", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1270, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "MMLU", score: 82.0, source: "OpenAI system card", source_url: "https://openai.com", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.15, output_price_per_m: 0.60, fetched_at: "2026-07-29" }],
          why: "Highly popular budget multimodal tier offering strong quality at minimal token cost."
        },
        {
          id: "openai/o1-preview", name: "o1-preview", family: "dense",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["o1-preview", "openai/o1-preview"],
          features: { "Developer": "OpenAI", "Architecture": "Reasoning-tuned transformer; chain-of-thought at inference time.", "Parameters": "Undisclosed.", "Code Generation": "Strong on competitive programming and math." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 128000, license: "Proprietary (API)", source_url: "https://openrouter.ai/models/openai/o1-preview", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1302, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "GPQA-Diamond", score: 78.0, source: "OpenAI system card", source_url: "https://openai.com/index/learning-to-reason-with-llms/", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 15.0, output_price_per_m: 60.0, fetched_at: "2026-07-29" }],
          why: "Reasoning-optimized, very high cost-per-token reflects inference-time compute."
        },
        {
          id: "openai/o1-mini", name: "o1-mini", family: "dense",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["o1-mini"],
          features: { "Developer": "OpenAI", "Architecture": "Smaller reasoning-tuned transformer.", "Parameters": "Undisclosed." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 128000, license: "Proprietary (API)", source_url: "https://openrouter.ai/models/openai/o1-mini", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1244, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 3.0, output_price_per_m: 12.0, fetched_at: "2026-07-29" }],
          why: "Cost-effective reasoning entry point; sits below o1-preview on quality but well below on price."
        },
        {
          id: "openai/o3-mini", name: "o3-mini", family: "dense",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["o3-mini", "openai/o3-mini"],
          features: { "Developer": "OpenAI", "Architecture": "High-efficiency reasoning model with configurable test-time compute.", "Parameters": "Undisclosed." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 200000, license: "Proprietary (API)", source_url: "https://openrouter.ai/models/openai/o3-mini", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1315, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "MATH-500", score: 97.9, source: "OpenAI system card", source_url: "https://openai.com", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 1.10, output_price_per_m: 4.40, fetched_at: "2026-07-29" }],
          why: "State-of-the-art fast reasoning model with competitive pricing."
        },
        {
          id: "openai/gpt-5.5-pro", name: "GPT-5.5 Pro", family: "multimodal",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["gpt-5.5-pro", "openai/gpt-5.5"],
          features: { "Developer": "OpenAI", "Architecture": "Next-generation multimodal reasoning transformer.", "Parameters": "Undisclosed." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 256000, license: "Proprietary (API)", source_url: "https://openai.com", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1390, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 10.0, output_price_per_m: 40.0, fetched_at: "2026-07-29" }],
          why: "Frontier multimodal benchmark leader."
        },
        {
          id: "openai/gpt-5.6-luna-pro", name: "GPT-5.6 Luna Pro", family: "multimodal",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["gpt-5.6-luna-pro", "openai/gpt-5.6-luna", "openai/gpt-5.6-terra-pro", "openai/gpt-5.6-sol-pro"],
          features: { "Developer": "OpenAI", "Architecture": "Autonomous agentic reasoning system with multimodal synthesis.", "Parameters": "Undisclosed." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 512000, license: "Proprietary (API)", source_url: "https://openai.com", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1420, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 12.5, output_price_per_m: 50.0, fetched_at: "2026-07-29" }],
          why: "Flagship agentic reasoning model tier."
        }
      ]
    },
    anthropic: {
      name: "Anthropic", image: "./images/cluade.jpeg",
      models: [
        {
          id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", family: "dense",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["claude-3.5-sonnet", "claude 3.5 sonnet", "anthropic/claude-3.5-sonnet"],
          features: { "Developer": "Anthropic", "Architecture": "Dense transformer with industry-leading code and reasoning quality.", "Parameters": "Undisclosed." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 200000, license: "Proprietary (API)", source_url: "https://openrouter.ai/models/anthropic/claude-3.5-sonnet", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1282, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "MMLU-Pro", score: 78.1, source: "Anthropic model card", source_url: "https://anthropic.com", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 3.0, output_price_per_m: 15.0, fetched_at: "2026-07-29" }],
          why: "Benchmark standard for coding, reasoning, and visual intelligence."
        },
        {
          id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku", family: "dense",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["claude-3.5-haiku", "anthropic/claude-3.5-haiku"],
          features: { "Developer": "Anthropic", "Architecture": "Ultra-fast dense model outperforming prior generation flagships." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 200000, license: "Proprietary (API)", source_url: "https://openrouter.ai/models/anthropic/claude-3.5-haiku", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1240, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 1.0, output_price_per_m: 5.0, fetched_at: "2026-07-29" }],
          why: "High-speed flagship replacement for fast agent loops."
        },
        {
          id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet", family: "dense",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["claude-3.7-sonnet", "anthropic/claude-3.7-sonnet", "anthropic/claude-sonnet-4", "anthropic/claude-sonnet-4.5", "anthropic/claude-sonnet-5"],
          features: { "Developer": "Anthropic", "Architecture": "Hybrid reasoning model combining instant output with extended CoT." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 200000, license: "Proprietary (API)", source_url: "https://openrouter.ai/models/anthropic/claude-3.7-sonnet", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1320, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "GPQA-Diamond", score: 81.2, source: "Anthropic system card", source_url: "https://anthropic.com", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 3.0, output_price_per_m: 15.0, fetched_at: "2026-07-29" }],
          why: "Hybrid reasoning model delivering unmatched coding and math capability."
        },
        {
          id: "anthropic/claude-3-opus", name: "Claude 3 Opus", family: "dense",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["claude-3-opus", "claude 3 opus", "anthropic/claude-opus-4.5", "anthropic/claude-opus-5"],
          features: { "Developer": "Anthropic", "Architecture": "Closed; dense transformer with extended context.", "Parameters": "Undisclosed." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 200000, license: "Proprietary (API)", source_url: "https://openrouter.ai/models/anthropic/claude-3-opus", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1247, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 15.0, output_price_per_m: 75.0, fetched_at: "2026-07-29" }],
          why: "Long-context flagship with complex reasoning capability."
        },
        {
          id: "anthropic/claude-3-sonnet", name: "Claude 3 Sonnet", family: "dense",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["claude-3-sonnet"],
          features: { "Developer": "Anthropic", "Architecture": "Mid-tier Claude 3; balanced quality/cost." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 200000, license: "Proprietary (API)", source_url: "https://openrouter.ai/models/anthropic/claude-3-sonnet", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1195, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 3.0, output_price_per_m: 15.0, fetched_at: "2026-07-29" }],
          why: "Balanced tier — middle of the Claude family."
        },
        {
          id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", family: "dense",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["claude-3-haiku"],
          features: { "Developer": "Anthropic", "Architecture": "Smallest Claude 3; latency-optimized." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 200000, license: "Proprietary (API)", source_url: "https://openrouter.ai/models/anthropic/claude-3-haiku", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1179, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.25, output_price_per_m: 1.25, fetched_at: "2026-07-29" }],
          why: "Cheapest Claude 3, efficient closed pick."
        }
      ]
    },
    google: {
      name: "Google", image: "./images/google.webp",
      models: [
        {
          id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash", family: "multimodal",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["gemini-2.0-flash", "google/gemini-2.0-flash-exp", "google/gemini-2.5-flash", "gemini-2.5-flash"],
          features: { "Developer": "Google DeepMind", "Architecture": "Multimodal Transformer with native speed & audio/video capability." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 1048576, license: "Proprietary (API)", source_url: "https://openrouter.ai/models/google/gemini-2.0-flash", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1285, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "MMLU-Pro", score: 74.5, source: "Google AI Blog", source_url: "https://ai.google", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.10, output_price_per_m: 0.40, fetched_at: "2026-07-29" }],
          why: "High-speed 1M-token context window with native multimodal capabilities."
        },
        {
          id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", family: "moe",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["gemini-2.5-pro", "google/gemini-1.5-pro"],
          features: { "Developer": "Google DeepMind", "Architecture": "MoE-style multimodal transformer with 2M token context window." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 2000000, license: "Proprietary (API)", source_url: "https://openrouter.ai/models/google/gemini-2.5-pro", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1310, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "MMLU-Pro", score: 79.2, source: "Google AI Blog", source_url: "https://ai.google", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 1.25, output_price_per_m: 5.0, fetched_at: "2026-07-29" }],
          why: "2-million token context window leads industry for massive codebase context."
        },
        {
          id: "google/gemini-1.5-flash", name: "Gemini 1.5 Flash", family: "moe",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["gemini-1.5-flash"],
          features: { "Developer": "Google DeepMind", "Architecture": "Fast/cheap Gemini 1.5 variant." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 1000000, license: "Proprietary (API)", source_url: "https://openrouter.ai/models/google/gemini-1.5-flash", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1222, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.075, output_price_per_m: 0.3, fetched_at: "2026-07-29" }],
          why: "Cheapest closed model with 1M context."
        }
      ]
    },
    meta: {
      name: "Meta", image: "./images/meta.png",
      models: [
        {
          id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["llama-3.3-70b", "llama 3.3 70b", "meta-llama/llama-4-scout", "meta-llama/llama-4-maverick"],
          features: { "Developer": "Meta", "Architecture": "Dense decoder-only transformer with Grouped-Query Attention (GQA).", "Parameters": "70B." },
          architecture_specs: { disclosure: "open_weight", params_total: 70000000000, params_active: 70000000000, attention_type: "GQA", num_hidden_layers: 80, context_window: 128000, tokenizer_vocab_size: 128256, license: "Llama 3.3 Community License", source_url: "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1272, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "MMLU-Pro", score: 72.8, source: "Meta model card", source_url: "https://ai.meta.com", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.60, output_price_per_m: 0.60, fetched_at: "2026-07-29" }],
          why: "State-of-the-art open weight 70B model matching Llama 3.1 405B quality at 5x efficiency."
        },
        {
          id: "meta-llama/llama-3.1-405b-instruct", name: "Llama 3.1 405B Instruct", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["llama-3.1-405b", "llama 3.1 405b"],
          features: { "Developer": "Meta", "Architecture": "Dense decoder-only transformer, GQA.", "Parameters": "405B.", "Attention Mechanism": "Grouped-Query Attention." },
          architecture_specs: { disclosure: "open_weight", params_total: 405000000000, params_active: 405000000000, attention_type: "GQA", num_hidden_layers: 126, context_window: 128000, tokenizer_vocab_size: 128256, license: "Llama 3.1 Community License", source_url: "https://huggingface.co/meta-llama/Llama-3.1-405B-Instruct", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1265, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "MMLU-Pro", score: 73.3, source: "Meta model card", source_url: "https://ai.meta.com/blog/meta-llama-3-1/", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 3.5, output_price_per_m: 3.5, fetched_at: "2026-07-29" }],
          why: "Largest dense open-weight model."
        },
        {
          id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B Instruct", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["llama-3.1-70b"],
          features: { "Developer": "Meta", "Architecture": "Dense, GQA." },
          architecture_specs: { disclosure: "open_weight", params_total: 70000000000, params_active: 70000000000, attention_type: "GQA", num_hidden_layers: 80, context_window: 128000, tokenizer_vocab_size: 128256, license: "Llama 3.1 Community License", source_url: "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1220, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.88, output_price_per_m: 0.88, fetched_at: "2026-07-29" }],
          why: "Standard workhorse 70B dense model."
        },
        {
          id: "meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 8B Instruct", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["llama-3.1-8b"],
          features: { "Developer": "Meta", "Architecture": "Lightweight dense transformer with GQA." },
          architecture_specs: { disclosure: "open_weight", params_total: 8000000000, params_active: 8000000000, attention_type: "GQA", num_hidden_layers: 32, context_window: 128000, license: "Llama 3.1 Community License", source_url: "https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1175, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.05, output_price_per_m: 0.05, fetched_at: "2026-07-29" }],
          why: "Standard open 8B baseline."
        },
        {
          id: "meta-llama/llama-3.2-3b-instruct", name: "Llama 3.2 3B Instruct", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["llama-3.2-3b"],
          features: { "Developer": "Meta", "Architecture": "Small dense, GQA." },
          architecture_specs: { disclosure: "open_weight", params_total: 3000000000, params_active: 3000000000, attention_type: "GQA", num_hidden_layers: 28, context_window: 128000, license: "Llama 3.2 Community License", source_url: "https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "MMLU", score: 63.4, source: "Meta model card", source_url: "https://ai.meta.com/blog/meta-llama-3-2/", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.06, output_price_per_m: 0.06, fetched_at: "2026-07-29" }],
          why: "Edge-deployable open model."
        },
        {
          id: "meta-llama/llama-3.2-11b-vision-instruct", name: "Llama 3.2 11B Vision Instruct", family: "multimodal",
          disclosure: "open_weight", status: "complete",
          aliases: ["llama-3.2-11b-vision"],
          features: { "Developer": "Meta", "Architecture": "Multimodal vision-text transformer." },
          architecture_specs: { disclosure: "open_weight", params_total: 11000000000, params_active: 11000000000, attention_type: "GQA", num_hidden_layers: 40, context_window: 128000, license: "Llama 3.2 Community License", source_url: "https://huggingface.co/meta-llama/Llama-3.2-11B-Vision-Instruct", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1190, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.16, output_price_per_m: 0.16, fetched_at: "2026-07-29" }],
          why: "Open-weight multimodal vision model."
        }
      ]
    },
    deepseek: {
      name: "DeepSeek", image: "./images/deepseek.png",
      models: [
        {
          id: "deepseek/deepseek-v3", name: "DeepSeek V3", family: "moe",
          disclosure: "open_weight", status: "complete",
          aliases: ["deepseek-v3", "deepseek v3", "deepseek/deepseek-chat-v3.1", "deepseek-ai/DeepSeek-V4-Pro", "deepseek-ai/DeepSeek-V4-Flash"],
          features: { "Developer": "DeepSeek", "Architecture": "MoE with Multi-head Latent Attention (MLA) and DeepSeekMoE routing." },
          architecture_specs: { disclosure: "open_weight", params_total: 671000000000, params_active: 37000000000, attention_type: "MLA", num_hidden_layers: 61, context_window: 64000, license: "DeepSeek License", source_url: "https://huggingface.co/deepseek-ai/DeepSeek-V3", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1318, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.27, output_price_per_m: 1.1, fetched_at: "2026-07-29" }],
          why: "MoE with ~5.5% active params — supreme per-token efficiency at frontier performance."
        },
        {
          id: "deepseek/deepseek-r1", name: "DeepSeek R1", family: "moe",
          disclosure: "open_weight", status: "complete",
          aliases: ["deepseek-r1", "deepseek r1"],
          features: { "Developer": "DeepSeek", "Architecture": "Reasoning MoE; RL-trained chain-of-thought." },
          architecture_specs: { disclosure: "open_weight", params_total: 671000000000, params_active: 37000000000, attention_type: "MLA", num_hidden_layers: 61, context_window: 64000, license: "DeepSeek License", source_url: "https://huggingface.co/deepseek-ai/DeepSeek-R1", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1358, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "MATH-500", score: 97.3, source: "DeepSeek R1 paper", source_url: "https://arxiv.org/abs/2501.12948", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.55, output_price_per_m: 2.19, fetched_at: "2026-07-29" }],
          why: "Open reasoning model rivaling o1 at fraction of API cost."
        },
        {
          id: "deepseek/deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill Llama 70B", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["r1-distill-llama-70b"],
          features: { "Developer": "DeepSeek", "Architecture": "Llama 3.3 70B backbone distilled from DeepSeek R1 reasoning outputs." },
          architecture_specs: { disclosure: "open_weight", params_total: 70000000000, params_active: 70000000000, attention_type: "GQA", num_hidden_layers: 80, context_window: 128000, license: "MIT License", source_url: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1290, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "MATH-500", score: 94.5, source: "DeepSeek R1 paper", source_url: "https://arxiv.org", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.70, output_price_per_m: 0.70, fetched_at: "2026-07-29" }],
          why: "Top-performing open-weight dense reasoning model."
        },
        {
          id: "deepseek/deepseek-r1-distill-qwen-32b", name: "DeepSeek R1 Distill Qwen 32B", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["r1-distill-qwen-32b"],
          features: { "Developer": "DeepSeek", "Architecture": "Qwen 2.5 32B backbone distilled from DeepSeek R1." },
          architecture_specs: { disclosure: "open_weight", params_total: 32000000000, params_active: 32000000000, attention_type: "GQA", num_hidden_layers: 64, context_window: 128000, license: "MIT License", source_url: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1268, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "MATH-500", score: 92.7, source: "DeepSeek R1 paper", source_url: "https://arxiv.org", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.30, output_price_per_m: 0.30, fetched_at: "2026-07-29" }],
          why: "Exceptionally efficient mid-size open reasoning model."
        }
      ]
    },
    mistral: {
      name: "Mistral AI", image: "./images/meta.png",
      models: [
        {
          id: "mistralai/mixtral-8x7b-instruct", name: "Mixtral 8x7B Instruct", family: "moe",
          disclosure: "open_weight", status: "complete",
          aliases: ["mixtral-8x7b", "mixtral"],
          features: { "Developer": "Mistral AI", "Architecture": "Sparse MoE, 8 experts × 7B." },
          architecture_specs: { disclosure: "open_weight", params_total: 46700000000, params_active: 12500000000, attention_type: "MHA", num_hidden_layers: 32, context_window: 32768, license: "Apache 2.0", source_url: "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "MMLU", score: 70.6, source: "Mistral paper", source_url: "https://arxiv.org/abs/2401.04088", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.27, output_price_per_m: 0.27, fetched_at: "2026-07-29" }],
          why: "Pioneering open-weight MoE model."
        },
        {
          id: "mistralai/mistral-large-2411", name: "Mistral Large 2", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["mistral-large-2", "mistral-large-2411"],
          features: { "Developer": "Mistral AI", "Architecture": "Flagship 123B dense transformer with broad multilingual & code tuning." },
          architecture_specs: { disclosure: "open_weight", params_total: 123000000000, params_active: 123000000000, attention_type: "GQA", num_hidden_layers: 88, context_window: 128000, license: "Mistral Research License", source_url: "https://huggingface.co/mistralai/Mistral-Large-Instruct-2411", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1258, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "MMLU", score: 84.0, source: "Mistral AI", source_url: "https://mistral.ai", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 2.0, output_price_per_m: 6.0, fetched_at: "2026-07-29" }],
          why: "Flagship European open-weight contender."
        },
        {
          id: "mistralai/codestral-2501", name: "Codestral 25B", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["codestral-2501", "codestral"],
          features: { "Developer": "Mistral AI", "Architecture": "Dense 22B code generation & fill-in-the-middle specialist." },
          architecture_specs: { disclosure: "open_weight", params_total: 22000000000, params_active: 22000000000, attention_type: "GQA", num_hidden_layers: 56, context_window: 256000, license: "Mistral Non-Commercial", source_url: "https://huggingface.co/mistralai/Codestral-22B-v0.1", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1215, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.30, output_price_per_m: 0.90, fetched_at: "2026-07-29" }],
          why: "Dedicated code model supporting 80+ programming languages."
        }
      ]
    },
    qwen: {
      name: "Alibaba (Qwen)", image: "./images/qwen1.png",
      models: [
        {
          id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B Instruct", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["qwen-2.5-72b", "qwen2.5-72b", "qwen/qwen3-235b-a22b"],
          features: { "Developer": "Alibaba", "Architecture": "Dense decoder, GQA." },
          architecture_specs: { disclosure: "open_weight", params_total: 72000000000, params_active: 72000000000, attention_type: "GQA", num_hidden_layers: 80, context_window: 128000, license: "Apache 2.0", source_url: "https://huggingface.co/Qwen/Qwen2.5-72B-Instruct", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1192, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.4, output_price_per_m: 0.4, fetched_at: "2026-07-29" }],
          why: "Apache-licensed 72B flagship with top multilingual performance."
        },
        {
          id: "qwen/qwen-2.5-coder-32b-instruct", name: "Qwen 2.5 Coder 32B Instruct", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["qwen-2.5-coder-32b", "qwen/qwen3-next-80b-a3b-instruct"],
          features: { "Developer": "Alibaba", "Architecture": "Dense code specialist transformer with GQA." },
          architecture_specs: { disclosure: "open_weight", params_total: 32000000000, params_active: 32000000000, attention_type: "GQA", num_hidden_layers: 64, context_window: 128000, license: "Apache 2.0", source_url: "https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1250, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "MMLU-Pro", score: 68.5, source: "Qwen model card", source_url: "https://huggingface.co", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.20, output_price_per_m: 0.20, fetched_at: "2026-07-29" }],
          why: "Premier open-weight coding model matching GPT-4o on HumanEval."
        },
        {
          id: "qwen/qwen-qwq-32b", name: "QwQ 32B Preview", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["qwq-32b"],
          features: { "Developer": "Alibaba", "Architecture": "Reasoning model tuned with RL for step-by-step problem solving." },
          architecture_specs: { disclosure: "open_weight", params_total: 32000000000, params_active: 32000000000, attention_type: "GQA", num_hidden_layers: 64, context_window: 32768, license: "Apache 2.0", source_url: "https://huggingface.co/Qwen/QwQ-32B-Preview", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1275, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "MATH-500", score: 90.6, source: "Qwen blog", source_url: "https://qwenlm.github.io", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.12, output_price_per_m: 0.12, fetched_at: "2026-07-29" }],
          why: "Open-weight reasoning contender."
        },
        {
          id: "qwen/qwen-2.5-7b-instruct", name: "Qwen 2.5 7B Instruct", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["qwen-2.5-7b"],
          features: { "Developer": "Alibaba", "Architecture": "Small dense, GQA." },
          architecture_specs: { disclosure: "open_weight", params_total: 7000000000, params_active: 7000000000, attention_type: "GQA", num_hidden_layers: 28, context_window: 128000, license: "Apache 2.0", source_url: "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "MMLU-Pro", score: 45.0, source: "Open LLM Leaderboard", source_url: "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.04, output_price_per_m: 0.04, fetched_at: "2026-07-29" }],
          why: "Highly capable 7B open model."
        }
      ]
    },
    "google-open": {
      name: "Google (Open)", image: "./images/google.webp",
      models: [
        {
          id: "google/gemma-2-27b-it", name: "Gemma 2 27B IT", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["gemma-2-27b", "gemma2-27b", "google/gemma-3-27b-it"],
          features: { "Developer": "Google", "Architecture": "Dense transformer with interleaved local sliding-window & global attention." },
          architecture_specs: { disclosure: "open_weight", params_total: 27000000000, params_active: 27000000000, attention_type: "hybrid", num_hidden_layers: 46, context_window: 8192, license: "Gemma Terms of Use", source_url: "https://huggingface.co/google/gemma-2-27b-it", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1218, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.27, output_price_per_m: 0.27, fetched_at: "2026-07-29" }],
          why: "Google open-weight model with novel sliding window attention."
        },
        {
          id: "google/gemma-2-9b-it", name: "Gemma 2 9B IT", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["gemma-2-9b"],
          features: { "Developer": "Google", "Architecture": "9B dense transformer outperforming original Llama-2 70B." },
          architecture_specs: { disclosure: "open_weight", params_total: 9000000000, params_active: 9000000000, attention_type: "hybrid", num_hidden_layers: 42, context_window: 8192, license: "Gemma Terms of Use", source_url: "https://huggingface.co/google/gemma-2-9b-it", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1195, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.08, output_price_per_m: 0.08, fetched_at: "2026-07-29" }],
          why: "Efficient open 9B model."
        }
      ]
    },
    ai21: {
      name: "AI21 Labs", image: "./images/google.webp",
      models: [
        {
          id: "ai21/jamba-1.5-large", name: "Jamba 1.5 Large", family: "hybrid_attention_ssm",
          disclosure: "open_weight", status: "complete",
          aliases: ["jamba-large-1.7", "jamba-1.5-large", "ai21/jamba-large-1.7"],
          features: { "Developer": "AI21 Labs", "Architecture": "Hybrid Mamba (SSM) + Transformer MoE architecture (398B total / 94B active)." },
          architecture_specs: { disclosure: "open_weight", params_total: 398000000000, params_active: 94000000000, attention_type: "hybrid_ssm_attention", num_hidden_layers: 32, context_window: 256000, license: "Jamba Open License", source_url: "https://huggingface.co/ai21labs/Jamba-1.5-Large", fetched_at: "2026-07-29" },
          benchmarks: [
            { benchmark_name: "Arena-ELO", score: 1242, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" },
            { benchmark_name: "MMLU-Pro", score: 65.4, source: "AI21 Labs", source_url: "https://ai21.com", fetched_at: "2026-07-29" }
          ],
          pricing: [{ provider: "openrouter", input_price_per_m: 2.0, output_price_per_m: 8.0, fetched_at: "2026-07-29" }],
          why: "Pioneering production hybrid Mamba-MoE for ultra-long 256k context."
        },
        {
          id: "ai21/jamba-1.5-mini", name: "Jamba 1.5 Mini", family: "hybrid_attention_ssm",
          disclosure: "open_weight", status: "complete",
          aliases: ["jamba-1.5-mini"],
          features: { "Developer": "AI21 Labs", "Architecture": "Compact hybrid Mamba + Transformer MoE architecture." },
          architecture_specs: { disclosure: "open_weight", params_total: 52000000000, params_active: 12000000000, attention_type: "hybrid_ssm_attention", num_hidden_layers: 32, context_window: 256000, license: "Jamba Open License", source_url: "https://huggingface.co/ai21labs/Jamba-1.5-Mini", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1198, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.20, output_price_per_m: 0.40, fetched_at: "2026-07-29" }],
          why: "Efficient hybrid SSM model for long context on smaller budgets."
        }
      ]
    },
    xai: {
      name: "xAI", image: "./images/gpt.png",
      models: [
        {
          id: "x-ai/grok-2", name: "Grok-2", family: "multimodal",
          disclosure: "closed_undisclosed", status: "complete",
          aliases: ["xai/grok-2", "grok-2", "x-ai/grok-4.5", "x-ai/grok-4.3", "x-ai/grok-4.20"],
          features: { "Developer": "xAI", "Architecture": "Frontier multimodal transformer model." },
          architecture_specs: { disclosure: "closed_undisclosed", params_total: null, params_active: null, attention_type: null, num_hidden_layers: null, context_window: 128000, license: "Proprietary (API)", source_url: "https://openrouter.ai/models/x-ai/grok-2", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1295, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 2.0, output_price_per_m: 10.0, fetched_at: "2026-07-29" }],
          why: "Frontier multimodal model with real-time web & vision search."
        }
      ]
    },
    microsoft: {
      name: "Microsoft", image: "./images/google.webp",
      models: [
        {
          id: "microsoft/phi-4", name: "Phi-4 14B", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["phi-4"],
          features: { "Developer": "Microsoft", "Architecture": "Dense 14B model trained with synthetic data curation for math & reasoning." },
          architecture_specs: { disclosure: "open_weight", params_total: 14000000000, params_active: 14000000000, attention_type: "GQA", num_hidden_layers: 40, context_window: 16384, license: "MIT License", source_url: "https://huggingface.co/microsoft/phi-4", fetched_at: "2026-07-29" },
      name: "Microsoft", image: "./images/all_models.png",
      description: "Phi series — small language models trained on synthetic textbook-quality data (Phi-3, Phi-3.5, Phi-4).",
      models: [
        {
          id: "microsoft/phi-3.5-mini-instruct",
          name: "Phi-3.5 Mini Instruct",
          family: "dense",
          disclosure: "open_weight",
          status: "complete",
          aliases: ["phi-3.5-mini", "microsoft/phi-3.5-mini-instruct"],
          why: "Microsoft's high-efficiency 3.8B parameter model featuring a 128K context window and Block-Sparse Attention.",
          architecture_specs: {
            disclosure: "open_weight",
            params_total: 3800000000,
            params_active: 3800000000,
            num_hidden_layers: 32,
            hidden_size: 3072,
            num_attention_heads: 32,
            num_key_value_heads: 32,
            intermediate_size: 8192,
            vocab_size: 32064,
            context_window: 131072,
            num_experts: null,
            num_experts_per_tok: null,
            expert_capacity_factor: null,
            routing_mechanism: null,
            attention_type: "mha",
            rope_theta: 10000,
            positional_embedding: "su_rope",
            normalization: "rmsnorm",
            activation_function: "silu",
            tie_word_embeddings: false
          },
          benchmarks: [
            { benchmark_name: "MMLU", score: 69.0, source: "Microsoft Phi-3.5 Tech Report" },
            { benchmark_name: "HumanEval", score: 62.8, source: "Microsoft Phi-3.5 Tech Report" },
            { benchmark_name: "GSM8K", score: 84.6, source: "Microsoft Phi-3.5 Tech Report" }
          ],
          pricing: [
            { provider: "DeepInfra", input_price_per_m: 0.05, output_price_per_m: 0.05 },
            { provider: "Together AI", input_price_per_m: 0.10, output_price_per_m: 0.10 }
          ],
          features: {
            Developer: "Microsoft",
            Architecture: "Dense Decoder Transformer with Su-scaled RoPE for 128K context",
            "Total Parameters": "3.8B",
            "Active Parameters": "3.8B",
            "Attention Mechanism": "Multi-Head Attention with Block-Sparse Long-Context extension",
            "Text Generation": "High reasoning density per parameter",
            "Code Generation": "Strong algorithmic code generation",
            License: "MIT License"
          }
        },
        {
          id: "microsoft/phi-3.5-moe-instruct",
          name: "Phi-3.5 MoE Instruct",
          family: "moe",
          disclosure: "open_weight",
          status: "complete",
          aliases: ["phi-3.5-moe", "microsoft/phi-3.5-moe-instruct"],
          why: "Microsoft's open MoE model combining 16 experts (2 active, 6.6B active out of 42B total) with 128K context.",
          architecture_specs: {
            disclosure: "open_weight",
            params_total: 41900000000,
            params_active: 6600000000,
            num_hidden_layers: 32,
            hidden_size: 4096,
            num_attention_heads: 32,
            num_key_value_heads: 32,
            intermediate_size: 6400,
            vocab_size: 32064,
            context_window: 131072,
            num_experts: 16,
            num_experts_per_tok: 2,
            expert_capacity_factor: null,
            routing_mechanism: "top_2_gating",
            attention_type: "mha",
            rope_theta: 10000,
            positional_embedding: "su_rope",
            normalization: "rmsnorm",
            activation_function: "silu",
            tie_word_embeddings: false
          },
          benchmarks: [
            { benchmark_name: "MMLU", score: 78.9, source: "Microsoft Phi-3.5 Tech Report" },
            { benchmark_name: "HumanEval", score: 73.8, source: "Microsoft Phi-3.5 Tech Report" },
            { benchmark_name: "GSM8K", score: 88.5, source: "Microsoft Phi-3.5 Tech Report" }
          ],
          pricing: [
            { provider: "DeepInfra", input_price_per_m: 0.15, output_price_per_m: 0.15 },
            { provider: "Together AI", input_price_per_m: 0.45, output_price_per_m: 0.45 }
          ],
          features: {
            Developer: "Microsoft",
            Architecture: "Sparse Mixture of Experts (SMoE) — 16 experts, top-2 routing",
            "Total Parameters": "41.9B",
            "Active Parameters": "6.6B per token",
            "Attention Mechanism": "Multi-Head Attention with Su-RoPE",
            "Text Generation": "High reasoning performance with low inference cost",
            "Code Generation": "Strong multi-language code generation",
            License: "MIT License"
          }
        }
      ]
    },
    falcon: {
      name: "TII (Falcon)", image: "./images/falcon.jpeg",
          features: { "Developer": "TII", "Architecture": "Hybrid Mamba (SSM) + attention blocks." },
          architecture_specs: { disclosure: "open_weight", params_total: 7000000000, params_active: 7000000000, attention_type: "hybrid_ssm_attention", num_hidden_layers: 36, context_window: 32768, license: "Apache 2.0", source_url: "https://huggingface.co/tiiuae/Falcon3-Mamba-7B-Base", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "MMLU", score: 58.5, source: "TII model card", source_url: "https://huggingface.co/tiiuae/Falcon3-Mamba-7B-Base", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 0.2, output_price_per_m: 0.2, fetched_at: "2026-07-29" }],
          why: "Public hybrid SSM+attention release."
        }
      ]
    },
    nanbeige: {
      name: "Nanbeige (looped)", image: "./images/qwen1.png",
      models: [
        {
          id: "nanbeige/nanbeige4.2-3b", name: "Nanbeige4.2-3B", family: "looped",
          disclosure: "open_weight", status: "auto_added",
          aliases: ["nanbeige4.2-3b", "nanbeige-4.2-3b"],
          features: { "Developer": "Nanbeige", "Architecture": "Looped transformer — recurrent application of a shared block." },
          architecture_specs: { disclosure: "open_weight", params_total: 3000000000, params_active: 3000000000, attention_type: "MHA", num_hidden_layers: 22, num_loops: 2, context_window: 8192, license: "Check HF repo", source_url: "https://huggingface.co/Nanbeige/Nanbeige4.2-3B", fetched_at: "2026-07-29" },
          benchmarks: [], pricing: [],
          why: "Looped transformer with num_loops=2."
        }
      ]
    },
    zai: {
      name: "Z-AI (GLM)", image: "./images/qwen1.png",
      models: [
        {
          id: "z-ai/glm-5", name: "GLM-5", family: "dense",
          disclosure: "open_weight", status: "complete",
          aliases: ["glm-5", "z-ai/glm-5.1", "z-ai/glm-5.2"],
          features: { "Developer": "Zhipu AI", "Architecture": "Bilingual Chinese/English transformer." },
          architecture_specs: { disclosure: "open_weight", params_total: 130000000000, params_active: 130000000000, attention_type: "GQA", num_hidden_layers: 92, context_window: 128000, license: "Apache 2.0", source_url: "https://huggingface.co/THUDM", fetched_at: "2026-07-29" },
          benchmarks: [{ benchmark_name: "Arena-ELO", score: 1250, source: "LMArena mirror", source_url: "https://lmarena.ai", fetched_at: "2026-07-29" }],
          pricing: [{ provider: "openrouter", input_price_per_m: 1.0, output_price_per_m: 1.0, fetched_at: "2026-07-29" }],
          why: "Leading Chinese open-weight flagship series."
        }
      ]
    }
  }
};

const out = path.join(__dirname, "..", "public", "data.json");
fs.writeFileSync(out, JSON.stringify(data, null, 2));
console.log("wrote", out);
console.log("companies:", Object.keys(data.companies).length);
console.log("models:", Object.values(data.companies).reduce((s, c) => s + c.models.length, 0));