# Contributing to LLM Atlas

Thank you for your interest in contributing to **LLM Atlas**! We welcome contributions to our dataset (`public/data.json`), architecture visualizers, ingestion fetchers, and website features.

---

## 🎃 Hacktoberfest 26 at GDG IIT Mandi

LLM Atlas is one of the official repositories for Hacktoberfest 26, hosted by Google Developer Groups, IIT Mandi (Oct 1 to Oct 31, 2026). The event rewards genuine work, so quality counts more than the number of pull requests.

Ground rules:

1. Register on the event page and link your GitHub account. Only registered participants are counted.
2. Only pull requests opened between Oct 1 and Oct 31, 2026 against the official repository count.
3. Claim before you code. Comment on an issue and wait for a maintainer to assign it. One issue, one pull request.
4. Keep it genuine. Spam, empty commits, whitespace-only edits, duplicate pull requests, and bot-farmed PRs are not accepted.
5. Make it your own work. If you use AI tools, you must understand and be able to explain every line you submit.
6. Follow this guide and the [Code of Conduct](CODE_OF_CONDUCT.md), and be kind in every review and comment.
7. Maintainers have the final say. A pull request marked spam or invalid does not count. The sequence is a warning, then marked invalid, then disqualification for repeated spam.

Issue labels:

- `good first issue`: start here.
- `help wanted`: medium effort.
- `hard`: bigger features.
- `docs`: no code needed.

Stuck? Ask in the issue thread, tag a maintainer on your pull request, or use the GDG IIT Mandi community chat and the weekend help sessions.

---

## 🌱 Your First Contribution

New to open source? Here is the full path from issue to merged pull request.

1. Pick an issue labelled `good first issue`. Comment on it to say you want to work on it, and wait for a maintainer to assign it to you before you start. This stops two people fixing the same bug.
2. Click **Fork** at the top right of the repository page, then clone your fork:

   ```bash
   git clone https://github.com/<your-username>/LLM-ATLAS.git
   cd LLM-ATLAS
   git remote add upstream https://github.com/Google-Developers-Group-IIT-MANDI/LLM-ATLAS.git
   ```

3. Create a branch for the issue: `git checkout -b fix/short-description`.
4. Make the change and run the checks listed under Development Setup below.
5. Commit with a short message that says what changed, then push: `git push origin fix/short-description`.
6. Open a pull request from your fork to `main`. Fill in the template and write `Fixes #<issue number>` so the issue closes when the PR merges.
7. Reviewers will leave comments. This is normal and not a rejection. Push more commits to the same branch to address them and the pull request updates itself.

Small pull requests are welcome, and asking questions on the issue is encouraged. If you get stuck, say where in the issue thread.

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
git clone https://github.com/Google-Developers-Group-IIT-MANDI/LLM-ATLAS.git
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
