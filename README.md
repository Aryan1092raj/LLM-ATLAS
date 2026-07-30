# LLM Atlas

> Every LLM, explained honestly. Architecture specs, raw benchmark scores, and hosted token economics — side-by-side, never blended.

**LLM Atlas** is an open-source interactive atlas and automated tracking engine for Large Language Model (LLM) architectures. It covers dense models, Mixture-of-Experts (MoE), Hybrid Attention-SSM (Mamba/Jamba), Looped architectures, and Multimodal foundation models.

---

## 🌟 Key Features

- **Side-by-Side Model Comparison**: Compare parameter counts (active vs total), context windows, attention mechanisms (GQA/MLA/SSM), hosted pricing, and raw benchmark scores.
- **Interactive React Flow Visualizers**: Detailed component-level architecture flow diagrams for over 50+ major model families.
- **Automated Data Ingestion Pipeline**: Python engine fetching daily model releases, specs, pricing, and benchmark scores from OpenRouter, Hugging Face Hub, and Open LLM Leaderboards.
- **Entity Resolution Engine**: Automatic model deduplication, alias normalization, instruct variant preservation, and vendor inference.
- **Cloudflare Pages Deployment**: Built-in Cloudflare Pages Function (`functions/[[path]].js`) with dynamic OpenGraph meta tag rewriting via `HTMLRewriter`.

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