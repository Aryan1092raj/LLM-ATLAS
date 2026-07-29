import React, { useEffect, useMemo, useState } from "react";
import { HashRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./index.css";
import "./styles/animations.css";
import "./App.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoadingScreen from "./components/LoadingScreen";
import HomePage from "./pages/HomePage";
import CompanyPage from "./pages/CompanyPage";
import ModelDetailPage from "./pages/ModelDetailPage";
import ComparePage from "./pages/ComparePage";
import MethodologyPage from "./pages/MethodologyPage";
import FamiliesPage from "./pages/FamiliesPage";
import FamilyExplainerPage from "./pages/FamilyExplainerPage";
import TimelinePage from "./pages/TimelinePage";
import ChangelogPage from "./pages/ChangelogPage";
import NotFoundPage from "./pages/NotFoundPage";
import { DataContext } from "./context/DataContext";

function Shell() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Load data.json once
  useEffect(() => {
    let cancelled = false;
    fetch(`${process.env.PUBLIC_URL}/data.json`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} loading data.json`);
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        setData(d);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const ctxValue = useMemo(() => {
    if (!data) return { data: null, companies: [], allModels: [], findModel: () => null };
    const companies = Object.entries(data.companies || {}).map(([key, v]) => ({ key, ...v }));
    const allModels = companies.flatMap((c) =>
      (c.models || []).map((m) => ({ ...m, companyKey: c.key, companyName: c.name, companyImage: c.image }))
    );
    const findModel = (idOrName) =>
      allModels.find(
        (m) => m.id === idOrName || m.name === idOrName || (m.aliases || []).includes(idOrName)
      );
    return { data, companies, allModels, findModel };
  }, [data]);

  const navItems = [
    { id: "home", label: "Home", onClick: () => navigate("/") },
    { id: "compare", label: "Compare", onClick: () => navigate("/compare") },
    { id: "families", label: "Families", onClick: () => navigate("/families") },
    { id: "timeline", label: "Timeline", onClick: () => navigate("/timeline") },
    { id: "methodology", label: "Methodology", onClick: () => navigate("/methodology") },
    { id: "changelog", label: "Changelog", onClick: () => navigate("/changelog") }
  ];

  const activeId = (() => {
    const p = location.pathname;
    if (p.startsWith("/compare")) return "compare";
    if (p.startsWith("/families") || p.startsWith("/family/")) return "families";
    if (p.startsWith("/timeline")) return "timeline";
    if (p.startsWith("/methodology")) return "methodology";
    if (p.startsWith("/changelog")) return "changelog";
    if (p === "/" || p === "") return "home";
    return "";
  })();

  if (loading) return <LoadingScreen />;
  if (error) {
    return (
      <div className="container section">
        <div className="clay clay--lg fx-pop" style={{ padding: 32, textAlign: "center" }}>
          <h2>Couldn't load data</h2>
          <p style={{ color: "var(--clay-ink-soft)" }}>{error}</p>
          <button className="btn btn--peach" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={ctxValue}>
      <Navbar
        items={navItems}
        activeId={activeId}
        brand={{ name: "LLM Atlas", onClick: () => navigate("/") }}
        cta={
          <button
            className="btn btn--accent"
            onClick={() => navigate("/compare")}
            aria-label="Compare models"
          >
            Compare →
          </button>
        }
      />
      <main id="main" className="container" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/company/:companyKey" element={<CompanyPage />} />
          <Route path="/model/:modelId" element={<ModelDetailPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/families" element={<FamiliesPage />} />
          <Route path="/family/:familyId" element={<FamilyExplainerPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </DataContext.Provider>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}