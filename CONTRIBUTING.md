# Contributing to LLM Atlas

Thank you for your interest in contributing to **LLM Atlas**! We welcome contributions to our dataset (`public/data.json`), architecture visualizers, ingestion fetchers, and website features.

---

## 🛠️ Data Quality & Provenance Principles

Every entry in LLM Atlas follows strict truthfulness standards:
1. **Never guess closed model specs**: Leave closed model fields (`params_total`, `num_hidden_layers`, `attention_type`) as `null` or `"closed_undisclosed"` unless explicitly confirmed in an official technical report or paper.
2. **Hugging Face Ground Truth**: Open-weight model specs are extracted directly from Hugging Face `config.json` via our automated pipeline.
3. **No Blended Benchmarks**: Every benchmark score must specify its exact benchmark name and official source URL.

---

## 🚀 Development Setup

```bash
# 1. Clone & Install Dependencies
git clone https://github.com/Aryan1092raj/LLM-ATLAS.git
cd LLM-ATLAS
npm install

# 2. Run Local Frontend Server
npm start

# 3. Execute Pipeline Unit Tests
python3 -m unittest discover -s pipeline/tests

# 4. Validate Seed Data IDs
npm run validate-ids
```

---

## 📋 Data Correction Flow

If you identify an inaccurate parameter or missing source URL:
1. Open an issue using our [Data Correction Template](.github/ISSUE_TEMPLATE/data-correction.yml).
2. Provide a link to the official system card, paper, or Hugging Face model repository.
3. Submit a PR updating `scripts/seed-data.js` or `pipeline/enrich/enrich.py`.

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
