import { useEffect } from "react";

/**
 * useReveal — toggles .is-revealed on .fx-reveal descendants when they
 * scroll into view (single-shot by default). Falls back gracefully if
 * IntersectionObserver is unavailable (SSR / very old browsers).
 */
export function useReveal({ rootMargin = "-40px 0px", threshold = 0.08 } = {}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const targets = document.querySelectorAll(".fx-reveal:not(.is-revealed)");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin, threshold }
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
}

/**
 * useRevealLive — re-runs observer whenever the watched list might change
 * (route changes, filter changes). Use when content swaps at runtime.
 */
export function useRevealLive(deps = []) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const targets = document.querySelectorAll(".fx-reveal:not(.is-revealed)");
    if (!targets.length || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-revealed"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "-40px 0px", threshold: 0.08 }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}