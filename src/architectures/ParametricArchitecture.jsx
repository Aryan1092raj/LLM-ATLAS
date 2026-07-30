import React, { useMemo } from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';

const ParametricArchitecture = ({ model, specs: propsSpecs }) => {
  const nodes = useMemo(() => {
    const specs = propsSpecs || model?.architecture_specs || {};
    const layers = specs.num_hidden_layers || specs.n_layer || 'N';
    const hiddenSize = specs.hidden_size || specs.d_model || specs.n_embd;
    const heads = specs.num_attention_heads;
    const kvHeads = specs.num_key_value_heads;
    const experts = specs.num_local_experts || specs.num_experts;
    const attType = specs.attention_type || (kvHeads && heads ? (kvHeads < heads ? 'GQA' : 'MHA') : 'Transformer');
    const ctx = specs.context_window ? `${(specs.context_window / 1024).toFixed(0)}k` : null;
    const rope = specs.rope_theta ? `RoPE θ=${specs.rope_theta}` : '';

    let attLabel = `Attention: ${attType}`;
    if (heads && kvHeads) {
      attLabel += ` (${heads} Query / ${kvHeads} KV Heads)`;
    } else if (heads) {
      attLabel += ` (${heads} Heads)`;
    }

    let ffnLabel = hiddenSize ? `Feed-Forward (Dim: ${hiddenSize})` : 'Feed-Forward Network';
    if (experts) {
      ffnLabel = `MoE Router → ${experts} Local Experts`;
    }

    return [
      {
        id: '1',
        type: 'input',
        data: { label: `Input Tokens${ctx ? ` (Max Context: ${ctx})` : ''}` },
        position: { x: 150, y: 10 },
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #3b82f6', borderRadius: 8, padding: 10 }
      },
      {
        id: '2',
        data: { label: `Embedding Layer${rope ? ` (${rope})` : ''}` },
        position: { x: 150, y: 80 },
        style: { background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: 6, padding: 10 }
      },
      {
        id: '3',
        data: {
          label: (
            <div style={{ padding: 10 }}>
              <div style={{ fontWeight: 'bold', color: '#60a5fa', marginBottom: 4 }}>
                {layers} x {attType} Transformer Blocks
              </div>
              <div style={{ fontSize: '0.85em', color: '#cbd5e1', marginBottom: 4 }}>
                • {attLabel}
              </div>
              <div style={{ fontSize: '0.85em', color: '#cbd5e1' }}>
                • {ffnLabel}
              </div>
            </div>
          )
        },
        position: { x: 50, y: 160 },
        style: { width: 350, background: '#1e1b4b', color: '#e0e7ff', border: '2px solid #6366f1', borderRadius: 10 }
      },
      {
        id: '4',
        data: { label: 'Layer Normalization & RMSNorm' },
        position: { x: 150, y: 290 },
        style: { background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: 6, padding: 10 }
      },
      {
        id: '5',
        type: 'output',
        data: { label: 'Output Vocabulary Probabilities (Logits)' },
        position: { x: 130, y: 370 },
        style: { background: '#064e3b', color: '#a7f3d0', border: '1px solid #10b981', borderRadius: 8, padding: 10 }
      }
    ];
  }, [propsSpecs, model]);

  const edges = useMemo(() => [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#3b82f6' } },
    { id: 'e2-3', source: '2', target: '3', style: { stroke: '#6366f1' } },
    { id: 'e3-4', source: '3', target: '4', style: { stroke: '#6366f1' } },
    { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#10b981' } }
  ], []);

  return (
    <div style={{ width: '100%', height: '480px', background: '#090d16', borderRadius: '12px', overflow: 'hidden' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <MiniMap nodeColor={() => '#6366f1'} maskColor="rgba(15, 23, 42, 0.7)" />
        <Controls />
        <Background color="#334155" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default ParametricArchitecture;
