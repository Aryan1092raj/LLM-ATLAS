import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';

const CalculatorPage = () => {
  const { data, loading } = useData();
  const [promptTokensM, setPromptTokensM] = useState(10); // Default 10M tokens/month
  const [completionTokensM, setCompletionTokensM] = useState(2); // Default 2M tokens/month
  const [minElo, setMinElo] = useState(1150);

  const calculatedModels = useMemo(() => {
    if (!data || !data.companies) return [];
    const list = [];

    Object.values(data.companies).forEach(company => {
      (company.models || []).forEach(m => {
        const pricing = m.pricing || [];
        if (!pricing.length) return;

        const bestPricing = pricing[0];
        const pIn = bestPricing.input_price_per_m || 0;
        const pOut = bestPricing.output_price_per_m || 0;

        const monthlyCost = (promptTokensM * pIn) + (completionTokensM * pOut);
        
        // Find ELO rating if available
        const arenaBench = (m.benchmarks || []).find(b => b.benchmark_name && b.benchmark_name.includes('Arena'));
        const elo = arenaBench ? arenaBench.score : null;

        list.append ? list.append() : list.push({
          id: m.id,
          name: m.name,
          company: company.name,
          family: m.family,
          inputPrice: pIn,
          outputPrice: pOut,
          provider: bestPricing.provider || 'API',
          monthlyCost: round2(monthlyCost),
          elo: elo
        });
      });
    });

    return list
      .filter(m => !minElo || (m.elo && m.elo >= minElo))
      .sort((a, b) => a.monthlyCost - b.monthlyCost);
  }, [data, promptTokensM, completionTokensM, minElo]);

  if (loading) {
    return <div style={{ padding: '40px', color: '#94a3b8' }}>Loading pricing data...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', color: '#f8fafc' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🧮 LLM Cost & Pricing Calculator
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
          Estimate your monthly API costs based on token volume and filter models meeting your quality threshold.
        </p>
      </header>

      {/* Control Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', background: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '32px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>
            Prompt Tokens (Millions / month): {promptTokensM}M
          </label>
          <input
            type="range"
            min="1"
            max="500"
            value={promptTokensM}
            onChange={e => setPromptTokensM(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#38bdf8' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>
            Completion Tokens (Millions / month): {completionTokensM}M
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={completionTokensM}
            onChange={e => setCompletionTokensM(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#818cf8' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>
            Min Arena-ELO Quality Floor: {minElo || 'Any'}
          </label>
          <select
            value={minElo}
            onChange={e => setMinElo(Number(e.target.value))}
            style={{ width: '100%', padding: '10px', background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px' }}
          >
            <option value={0}>All Models (No Floor)</option>
            <option value={1150}>1150+ (Standard)</option>
            <option value={1220}>1220+ (High Quality)</option>
            <option value={1280}>1280+ (Frontier Tier)</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div style={{ overflowX: 'auto', background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.875rem' }}>
              <th style={{ padding: '16px' }}>Rank</th>
              <th style={{ padding: '16px' }}>Model</th>
              <th style={{ padding: '16px' }}>Provider</th>
              <th style={{ padding: '16px' }}>Arena ELO</th>
              <th style={{ padding: '16px' }}>Input ($/1M)</th>
              <th style={{ padding: '16px' }}>Output ($/1M)</th>
              <th style={{ padding: '16px', color: '#38bdf8' }}>Est. Monthly Cost</th>
            </tr>
          </thead>
          <tbody>
            {calculatedModels.map((m, idx) => (
              <tr key={m.id} style={{ borderBottom: '1px solid #1e293b', fontSize: '0.9rem' }}>
                <td style={{ padding: '16px', color: '#64748b', fontWeight: '700' }}>#{idx + 1}</td>
                <td style={{ padding: '16px', fontWeight: '600', color: '#f8fafc' }}>
                  {m.name} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({m.company})</span>
                </td>
                <td style={{ padding: '16px', color: '#cbd5e1' }}>{m.provider}</td>
                <td style={{ padding: '16px', color: '#f59e0b', fontWeight: '600' }}>{m.elo ? Math.round(m.elo) : '—'}</td>
                <td style={{ padding: '16px', color: '#cbd5e1' }}>${m.inputPrice.toFixed(3)}</td>
                <td style={{ padding: '16px', color: '#cbd5e1' }}>${m.outputPrice.toFixed(3)}</td>
                <td style={{ padding: '16px', fontWeight: '700', color: idx === 0 ? '#10b981' : '#38bdf8', fontSize: '1rem' }}>
                  ${m.monthlyCost.toFixed(2)}/mo
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function round2(num) {
  return Math.round(num * 100) / 100;
}

export default CalculatorPage;
