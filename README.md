# LLM Atlas

> Every LLM, explained honestly. Architecture + raw benchmarks + cost — side by side, never blended.

Open-source atlas of large language models. Tracks flagship + notable open-weight models
across architecture family (dense / MoE / hybrid-SSM / looped), benchmark scores
(Arena ELO, MMLU-Pro, GPQA, …), and hosted pricing.

Built as a **fork** of [Devisri-B/LLM-Architectures](https://github.com/Devisri-B/LLM-Architectures)
(MIT) — we keep the React Flow architecture diagrams and extend them with a real data layer.

## Stack

| Layer | Choice |
|---|---|
| UI | React (CRA), HashRouter |
| Diagrams | React Flow (forked upstream) |
| Data | Flat JSON committed to repo (`public/data.json`) |
| Style | Hand-rolled claymorphism design system in `src/index.css` |
| Animation | Hand-rolled primitives in `src/styles/animations.css` |

## Quickstart

```bash
npm install
npm start            # http://localhost:3000
npm run build        # production build → build/
```

## Repo layout

```
src/
  components/        # Navbar, ModelCard, ArchitecturePanel, BenchmarksTable, …
  pages/             # HomePage, CompanyPage, ModelDetailPage, ComparePage, MethodologyPage, NotFoundPage
  context/           # DataContext
  hooks/             # useReveal (scroll-reveal via IntersectionObserver)
  lib/               # format.js, metrics.js (Efficiency Score, Value Frontier)
  styles/            # animations.css (keyframes + utility classes)
  architectures/     # React Flow diagrams (forked upstream + DiagramRegistry)
public/
  data.json          # canonical model records
scripts/             # seed-data.js (rebuilds data.json from scratch)
```

## Phase status

- [x] **Phase 0** — fork upstream, restructure, design system
- [x] **Phase 1** — MVP with ~20 flagship models, scorecard UI
- [ ] **Phase 2** — automated ingestion pipeline (Python)
- [ ] **Phase 3** — comparison polish, Efficiency Score / Value Frontier live in compare table
- [ ] **Phase 4** — architecture-family explainers + timeline
- [ ] **Phase 5** — methodology + changelog pages, accessibility pass

## License

MIT — see [LICENSE](LICENSE). Forked from Devisri-B/LLM-Architectures (MIT).