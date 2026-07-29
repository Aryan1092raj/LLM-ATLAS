import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";
import "./Footer.css";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="footer-section">
      <div className="container">
        <div className="footer-clay clay fx-rise">
          <div className="footer-brand">
            <button
              type="button"
              className="footer-brand__btn"
              onClick={() => navigate("/")}
            >
              <Logo size={28} />
              <span>LLM Atlas</span>
            </button>
            <p className="footer-tagline">
              Open-source atlas of large language models — architecture specs, raw benchmarks, and hosted pricing side by side.
            </p>
          </div>

          <div className="footer-links">
            <button type="button" onClick={() => navigate("/")}>Home</button>
            <button type="button" onClick={() => navigate("/compare")}>Compare</button>
            <button type="button" onClick={() => navigate("/families")}>Families</button>
            <button type="button" onClick={() => navigate("/timeline")}>Timeline</button>
            <button type="button" onClick={() => navigate("/methodology")}>Methodology</button>
          </div>

          <div className="footer-bottom">
            <span>LLM Atlas · Open Source (MIT)</span>
            <span className="footer-pill">399 Models Tracked</span>
            <span className="footer-pill">56 Providers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}