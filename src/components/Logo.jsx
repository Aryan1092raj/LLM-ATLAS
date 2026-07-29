import React from "react";

/**
 * Brand mark — renders the favicon asset as an <img>.
 * Same file as /public/favicon.svg, so navbar + cards + browser tab
 * all share one visual identity.
 *
 * Sized via the `size` prop; the underlying SVG is fully scalable.
 */
export default function Logo({ size = 36, withShadow = true, title = "LLM Atlas" }) {
  const style = withShadow
    ? {
        filter:
          "drop-shadow(2px 3px 4px rgba(125, 95, 180, 0.35)) drop-shadow(-2px -2px 3px rgba(255, 255, 255, 0.7))",
      }
    : {};
  return (
    <img
      src={`${process.env.PUBLIC_URL}/favicon.svg`}
      alt={title}
      width={size}
      height={size}
      style={style}
      draggable="false"
    />
  );
}
