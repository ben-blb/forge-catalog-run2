import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { categoryApi } from '../api/category.generated';
import { productApi } from '../api/product.generated';
import { ProductListScreen } from './ProductListScreen.owned';

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ProductListScreen />
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe('REQ-002.AC1', () => {
  it('REQ-002.AC1 muestra carga', () => {
    vi.spyOn(productApi, 'list').mockReturnValue(new Promise(() => {}));
    vi.spyOn(categoryApi, 'list').mockResolvedValue([]);
    renderScreen();
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('REQ-002.AC1 muestra vacío', async () => {
    vi.spyOn(productApi, 'list').mockResolvedValue([]);
    vi.spyOn(categoryApi, 'list').mockResolvedValue([]);
    renderScreen();
    expect(await screen.findByText('Aún no hay productos')).toBeTruthy();
  });

  it('REQ-002.AC1 muestra error y reintenta', async () => {
    const list = vi
      .spyOn(productApi, 'list')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue([]);
    vi.spyOn(categoryApi, 'list').mockResolvedValue([]);
    renderScreen();
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Aún no hay productos')).toBeTruthy();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('REQ-002.AC1 muestra sku, nombre, precio y categoría', async () => {
    vi.spyOn(productApi, 'list').mockResolvedValue([
      {
        id: 'p1',
        sku: 'SKU-1',
        name: 'Tornillo',
        price: '9.50',
        categoryId: 'c1',
        discontinuedAt: null,
        discontinueReason: null,
      },
    ]);
    vi.spyOn(categoryApi, 'list').mockResolvedValue([
      { id: 'c1', name: 'Ferretería' },
    ]);
    renderScreen();
    expect(await screen.findByText('SKU-1')).toBeTruthy();
    expect(screen.getByText('Tornillo')).toBeTruthy();
    expect(screen.getByText('9.50')).toBeTruthy();
    expect(await screen.findByText('Ferretería')).toBeTruthy();
  });
});
