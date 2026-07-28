import React from "react";
import "./LoadingScreen.css";

export default function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-clay">
        <div className="loading-orb" />
        <p>Loading model atlas…</p>
      </div>
    </div>
  );
}