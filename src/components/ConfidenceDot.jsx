import React from 'react';

const CONFIDENCE_CONFIG = {
  verified: {
    color: '#10b981',
    bg: '#064e3b',
    border: '#059669',
    label: 'Verified',
    tooltip: 'Ground truth — extracted from Hugging Face config.json',
    icon: '🟢'
  },
  reported: {
    color: '#f59e0b',
    bg: '#78350f',
    border: '#d97706',
    label: 'Reported',
    tooltip: 'Reported — cited from official system card or tech report',
    icon: '🟡'
  },
  undisclosed: {
    color: '#94a3b8',
    bg: '#1e293b',
    border: '#475569',
    label: 'Undisclosed',
    tooltip: 'Undisclosed — closed model or unverified API endpoint',
    icon: '⚪'
  }
};

const ConfidenceDot = ({ confidence = 'undisclosed', showLabel = true }) => {
  const cfg = CONFIDENCE_CONFIG[confidence.toLowerCase()] || CONFIDENCE_CONFIG.undisclosed;

  return (
    <span
      title={cfg.tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: cfg.color,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '9999px',
        padding: '2px 8px',
        cursor: 'help',
        userSelect: 'none'
      }}
    >
      <span>{cfg.icon}</span>
      {showLabel && <span>{cfg.label}</span>}
    </span>
  );
};

export default ConfidenceDot;
