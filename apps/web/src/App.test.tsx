import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { App } from './App';

it('la app renderiza', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'App' })).toBeTruthy();
});
