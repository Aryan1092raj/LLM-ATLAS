import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';

const CalculatorPage = () => {
  const { data, loading } = useData();
  const [promptTokensM, setPromptTokensM] = useState(10); // Default 10M tokens/month
  const [completionTokensM, setCompletionTokensM] = useState(2); // Default 2M tokens/month
  const [minElo, setMinElo] = useState(1150);
  const [selectedModelIds, setSelectedModelIds] = useState([]);

  // Flattened list of models with pricing
  const availableModels = useMemo(() => {
    if (!data || !data.companies) return [];
    const list = [];
    Object.values(data.companies).forEach(company => {
      (company.models || []).forEach(m => {
        const pricing = m.pricing || [];
        if (pricing.length > 0) {
          list.push({
            id: m.id,
            name: m.name,
            company: company.name
          });
        }
      });
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const calculatedModels = useMemo(() => {
    if (!data || !data.companies) return [];
    const list = [];

    Object.values(data.companies).forEach(company => {
      (company.models || []).forEach(m => {
        const pricing = m.pricing || [];
        if (!pricing.length) return;

        // If specific models are chosen, filter out others
        if (selectedModelIds.length > 0 && !selectedModelIds.includes(m.id)) {
          return;
        }

        const bestPricing = pricing[0];
        const pIn = bestPricing.input_price_per_m || 0;
        const pOut = bestPricing.output_price_per_m || 0;

        const monthlyCost = (promptTokensM * pIn) + (completionTokensM * pOut);
        
        // Find ELO rating if available
        const arenaBench = (m.benchmarks || []).find(b => b.benchmark_name && b.benchmark_name.includes('Arena'));
        const elo = arenaBench ? arenaBench.score : null;

        list.push({
          id: m.id,
          name: m.name,
          company: company.name,
          family: m.family,
          inputPrice: pIn,
          outputPrice: pOut,
          provider: bestPricing.provider || 'API',
          monthlyCost: Math.round(monthlyCost * 100) / 100,
          elo: elo
        });
      });
    });

    return list
      .filter(m => !minElo || (m.elo && m.elo >= minElo))
      .sort((a, b) => a.monthlyCost - b.monthlyCost);
  }, [data, promptTokensM, completionTokensM, minElo, selectedModelIds]);

  const handleModelToggle = (id) => {
    setSelectedModelIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--clay-ink-soft)', textAlign: 'center' }}>Loading pricing data...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', color: 'var(--clay-ink)' }} className="fx-pop">
      <header style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', color: 'var(--clay-ink)' }}>
          🧮 LLM Cost & Pricing Calculator
        </h1>
        <p style={{ color: 'var(--clay-ink-soft)', fontSize: '1.1rem' }}>
          Estimate your monthly API costs based on token volume and filter models meeting your quality threshold.
        </p>
      </header>

      {/* Control Panel (Claymorphic) */}
      <div 
        style={{ 
          background: 'var(--clay-surface)', 
          padding: '28px', 
          borderRadius: '20px', 
          boxShadow: 'var(--clay-shadow-out)', 
          border: '1px solid rgba(255, 255, 255, 0.5)',
          marginBottom: '32px'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          
          {/* Prompt Tokens Input Box */}
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: 'var(--clay-ink)', marginBottom: '8px' }}>
              Prompt Tokens (Millions / month)
            </label>
            <input
              type="number"
              min="0"
              value={promptTokensM}
              onChange={e => setPromptTokensM(Math.max(0, Number(e.target.value)))}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--clay-surface-raised)',
                color: 'var(--clay-ink)',
                border: 'none',
                borderRadius: '10px',
                boxShadow: 'var(--clay-shadow-in)',
                fontWeight: '600',
                outline: 'none'
              }}
            />
          </div>

          {/* Completion Tokens Input Box */}
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: 'var(--clay-ink)', marginBottom: '8px' }}>
              Completion Tokens (Millions / month)
            </label>
            <input
              type="number"
              min="0"
              value={completionTokensM}
              onChange={e => setCompletionTokensM(Math.max(0, Number(e.target.value)))}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--clay-surface-raised)',
                color: 'var(--clay-ink)',
                border: 'none',
                borderRadius: '10px',
                boxShadow: 'var(--clay-shadow-in)',
                fontWeight: '600',
                outline: 'none'
              }}
            />
          </div>

          {/* Min ELO Quality Floor Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: 'var(--clay-ink)', marginBottom: '8px' }}>
              Min Arena-ELO Quality Floor
            </label>
            <select
              value={minElo}
              onChange={e => setMinElo(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--clay-surface-raised)',
                color: 'var(--clay-ink)',
                border: 'none',
                borderRadius: '10px',
                boxShadow: 'var(--clay-shadow-in)',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value={0}>All Models (No Floor)</option>
              <option value={1150}>1150+ (Standard)</option>
              <option value={1220}>1220+ (High Quality)</option>
              <option value={1280}>1280+ (Frontier Tier)</option>
            </select>
          </div>

        </div>

        {/* Model Selection Option Checklist */}
        <div style={{ marginTop: '24px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: 'var(--clay-ink)', marginBottom: '12px' }}>
            Choose Target Models (Optional — showing all if none selected)
          </label>
          <div 
            style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '10px', 
              maxHeight: '120px', 
              overflowY: 'auto', 
              padding: '8px', 
              background: 'var(--clay-surface-raised)', 
              borderRadius: '10px', 
              boxShadow: 'var(--clay-shadow-in)' 
            }}
          >
            {availableModels.map(m => {
              const isSelected = selectedModelIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => handleModelToggle(m.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? 'var(--clay-accent)' : 'var(--clay-surface)',
                    color: isSelected ? '#ffffff' : 'var(--clay-ink-soft)',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: 'var(--clay-shadow-out-sm)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Table (Claymorphic) */}
      <div 
        style={{ 
          background: 'var(--clay-surface)', 
          borderRadius: '20px', 
          boxShadow: 'var(--clay-shadow-out)', 
          border: '1px solid rgba(255, 255, 255, 0.5)',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--clay-surface-raised)', borderBottom: '2px solid rgba(0,0,0,0.06)', color: 'var(--clay-ink-soft)', fontSize: '0.875rem', fontWeight: '700' }}>
                <th style={{ padding: '16px 24px' }}>Rank</th>
                <th style={{ padding: '16px' }}>Model</th>
                <th style={{ padding: '16px' }}>Provider</th>
                <th style={{ padding: '16px' }}>Arena ELO</th>
                <th style={{ padding: '16px' }}>Input ($/1M)</th>
                <th style={{ padding: '16px' }}>Output ($/1M)</th>
                <th style={{ padding: '16px 24px', color: 'var(--clay-accent)' }}>Est. Monthly Cost</th>
              </tr>
            </thead>
            <tbody>
              {calculatedModels.map((m, idx) => (
                <tr 
                  key={m.id} 
                  style={{ 
                    borderBottom: '1px solid rgba(0,0,0,0.04)', 
                    fontSize: '0.95rem',
                    background: idx === 0 ? 'rgba(102, 196, 184, 0.08)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '16px 24px', color: 'var(--clay-ink-faint)', fontWeight: '800' }}>#{idx + 1}</td>
                  <td style={{ padding: '16px', fontWeight: '700', color: 'var(--clay-ink)' }}>
                    {m.name} <span style={{ fontSize: '0.75rem', color: 'var(--clay-ink-soft)' }}>({m.company})</span>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--clay-ink-soft)' }}>{m.provider}</td>
                  <td style={{ padding: '16px', color: 'var(--clay-accent-warm)', fontWeight: '700' }}>{m.elo ? Math.round(m.elo) : '—'}</td>
                  <td style={{ padding: '16px', color: 'var(--clay-ink)' }}>${m.inputPrice.toFixed(3)}</td>
                  <td style={{ padding: '16px', color: 'var(--clay-ink)' }}>${m.outputPrice.toFixed(3)}</td>
                  <td style={{ padding: '16px 24px', fontWeight: '800', color: idx === 0 ? 'var(--clay-accent-2)' : 'var(--clay-accent)', fontSize: '1.05rem' }}>
                    ${m.monthlyCost.toFixed(2)}/mo
                  </td>
                </tr>
              ))}
              {calculatedModels.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--clay-ink-soft)' }}>
                    No models matching quality floor or selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;
