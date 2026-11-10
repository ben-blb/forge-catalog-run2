// Generado por `make gen`. No editar.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from './App';

// Las pantallas llaman a la API: un fetch que nunca resuelve deja cada una en su estado de carga.
beforeEach(() => {
  vi.stubGlobal('fetch', () => new Promise(() => {}));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.pushState({}, '', '/');
});

it('SCR-001.route', () => {
  window.history.pushState({}, '', '/products');
  const { container } = render(<App />);
  expect(container.querySelector('[data-screen="SCR-001"]')).not.toBeNull();
});

it('screens.nav', () => {
  render(<App />);
  expect(
    screen.queryAllByRole('link').map((a) => a.getAttribute('href')),
  ).toEqual(['/products']);
});
