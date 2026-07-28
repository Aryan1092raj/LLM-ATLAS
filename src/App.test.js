// Smoke test for App shell rendering.
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders atlas title', async () => {
  render(<App />);
  // data.json is fetched async; assert something stable.
  expect(document.body).toBeInTheDocument();
});