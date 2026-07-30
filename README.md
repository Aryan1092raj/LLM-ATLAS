# LLM Atlas

[![Daily Ingestion Pipeline](https://github.com/Aryan1092raj/LLM-ATLAS/actions/workflows/daily-pipeline.yml/badge.svg)](https://github.com/Aryan1092raj/LLM-ATLAS/actions/workflows/daily-pipeline.yml)
[![Pipeline CI](https://github.com/Aryan1092raj/LLM-ATLAS/actions/workflows/pipeline-ci.yml/badge.svg)](https://github.com/Aryan1092raj/LLM-ATLAS/actions/workflows/pipeline-ci.yml)
[![Weekly Data Review](https://github.com/Aryan1092raj/LLM-ATLAS/actions/workflows/weekly-data-review.yml/badge.svg)](https://github.com/Aryan1092raj/LLM-ATLAS/actions/workflows/weekly-data-review.yml)

> Every LLM, explained honestly. Architecture specs, raw benchmark scores, and hosted token economics — side-by-side, never blended.

**LLM Atlas** is an open-source interactive atlas and automated tracking engine for Large Language Model (LLM) architectures. It covers dense models, Mixture-of-Experts (MoE), Hybrid Attention-SSM (Mamba/Jamba), Looped architectures, and Multimodal foundation models.

---

## 🌟 Key Features

- **Side-by-Side Model Comparison**: Compare parameter counts (active vs total), context windows, attention mechanisms (GQA/MLA/SSM), hosted pricing, and raw benchmark scores.
- **Parametric & Interactive Visualizers**: Dynamic React Flow architecture flow diagrams for over 50+ major model families, auto-generated from Hugging Face configs.
- **LLM Pricing & Cost Calculator**: Interactive token volume calculator to estimate monthly API costs and filter by quality thresholds.
- **Automated Data Ingestion Pipeline**: Python engine fetching daily model releases, specs, pricing, and benchmark scores from OpenRouter, Hugging Face Hub, Open LLM Leaderboards, and Artificial Analysis.
- **Entity Resolution & Provenance**: Automatic model deduplication, alias normalization, and visual confidence badges (🟢 Verified ground truth, 🟡 Reported, ⚪ Undisclosed).
- **Public Versioned API & RSS Feed**: Serverless `/api/v1/models.json` endpoint and `/feed.xml` RSS feed.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router (`BrowserRouter`), Claymorphism CSS |
| **Diagrams** | React Flow 11 |
| **Ingestion Pipeline** | Python 3.10+ (Zero-dependency stdlib core + pandas/pyarrow for parquet ingestion) |
| **Data Storage** | Canonical JSON (`public/data.json`) & Line-delimited JSON run logs |
| **Deployment** | Cloudflare Pages & GitHub Actions Cron Automation |

---

## 🚀 Quickstart

### Prerequisites
- Node.js `18+` or `20+`
- Python `3.10+`

### 1. Web Application

```bash
# Install dependencies
npm install

# Start local dev server (http://localhost:3000)
npm start

# Create production build
npm run build
```

### 2. Ingestion Pipeline

```bash
# Execute full ingestion flow (fetch → normalize → resolve → enrich → commit)
python3 -m pipeline.run

# Run entity resolution unit tests
python3 pipeline/tests/test_resolve.py

# Validate curated seed IDs against canonical data
npm run validate-ids
```

---

## 📁 Repository Structure

```
├── .github/workflows/      # Automated daily ingestion & deployment workflows
├── functions/              # Cloudflare Pages Functions (HTMLRewriter SEO engine)
├── pipeline/               # Ingestion & normalization engine
│   ├── fetchers/           # OpenRouter, HuggingFace, Leaderboard, Arena fetchers
│   ├── resolve/            # Levenshtein & alias entity resolution module
│   ├── enrich/             # Spec extraction, benchmark matching & auto-promotion
│   └── tests/              # Pipeline unit tests
├── public/                 # Static assets & canonical dataset (public/data.json)
├── scripts/                # Validation & seed maintenance utilities
└── src/
    ├── architectures/      # Interactive React Flow diagram components & registry
    ├── components/         # Comparison tables, scorecards, charts, navbar, footer
    ├── context/            # DataContext state provider
    ├── lib/                # Value frontier, efficiency scoring & formatters
    └── pages/              # Compare, Model Detail, Families, Timeline & Changelog
```

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details. Forked from [Devisri-B/LLM-Architectures](https://github.com/Devisri-B/LLM-Architectures) (MIT).