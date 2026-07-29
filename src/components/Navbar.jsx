import React, { useCallback, useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import "./Navbar.css";

/**
 * Navbar — clay pill, hamburger menu with a11y-correct drawer.
 *
 * Props:
 *   items:     [{ id, label, onClick }]   — primary nav items
 *   brand:     { name, onClick } — brand block (logo is rendered from <Logo/>)
 *   cta:       ReactNode                   — right-side call-to-action
 *   activeId:  string                      — id of current section/page
 */
export default function Navbar({ items = [], brand, cta, activeId }) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef(null);
  const burgerRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  // ESC closes the sheet
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Click on scrim closes; click on link also closes (handled inline)
  const onScrimClick = (e) => {
    if (e.target === e.currentTarget) close();
  };

  const handleLinkClick = (fn) => (e) => {
    close();
    fn?.(e);
  };

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>

      <nav className="nav" aria-label="Primary">
        <button
          type="button"
          className="nav__brand"
          onClick={brand?.onClick}
          aria-label={`${brand?.name || "Home"} — go to top`}
        >
          <span className="nav__logo" aria-hidden="true"><Logo size={36} /></span>
          <span>{brand?.name || "LLM Atlas"}</span>
        </button>

        <div className="nav__links" role="menubar">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              role="menuitem"
              className={`nav__link ${activeId === it.id ? "is-active" : ""}`}
              onClick={it.onClick}
              aria-current={activeId === it.id ? "page" : undefined}
            >
              {it.label}
            </button>
          ))}
        </div>

        <div className="nav__cta">
          {cta}
          <button
            ref={burgerRef}
            type="button"
            className="nav__burger nav__cta-burger"
            aria-expanded={open}
            aria-controls="nav-sheet"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((s) => !s)}
          >
            <span className="nav__burger-lines" aria-hidden="true" />
          </button>
        </div>
      </nav>

      <div
        id="nav-sheet"
        ref={sheetRef}
        className={`nav__sheet ${open ? "is-open" : ""}`}
        aria-hidden={!open}
        onClick={onScrimClick}
      >
        <div className="nav__sheet-scrim" />
        <aside className="nav__sheet-panel" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="nav__sheet-title">Navigate</div>
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              className={`nav__sheet-link ${activeId === it.id ? "is-active" : ""}`}
              onClick={handleLinkClick(it.onClick)}
              aria-current={activeId === it.id ? "page" : undefined}
            >
              <span>{it.label}</span>
              <span className="arrow" aria-hidden="true">→</span>
            </button>
          ))}
          {cta && (
            <div style={{ marginTop: "auto", paddingTop: 16 }}>{cta}</div>
          )}
        </aside>
      </div>
    </>
  );
}