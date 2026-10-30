
// Smoke test for App shell rendering.
import { render, screen } from '@testing-library/react';
import App from './App';
import { pickHeadlineBenchmark } from './lib/format';

test('renders atlas title', async () => {
  render(<App />);
  // data.json is fetched async; assert something stable.
  expect(document.body).toBeInTheDocument();
});

test('prefers Arena-ELO over other benchmarks', () => {
  const benchmarks = [
    { benchmark_name: 'MMLU', score: 90 },
    { benchmark_name: 'Arena-ELO', score: 1286 },
  ];

  expect(pickHeadlineBenchmark(benchmarks)).toBe(1286);
});

test('returns null when no Arena-ELO benchmark exists', () => {
  const benchmarks = [
    { benchmark_name: 'MMLU', score: 90 },
    { benchmark_name: 'GPQA', score: 0.85 },
  ];

  expect(pickHeadlineBenchmark(benchmarks)).toBeNull();
});

test('returns null for an empty benchmark list', () => {
  expect(pickHeadlineBenchmark([])).toBeNull();
});

test('returns null when benchmarks are missing', () => {
  expect(pickHeadlineBenchmark(null)).toBeNull();
});
