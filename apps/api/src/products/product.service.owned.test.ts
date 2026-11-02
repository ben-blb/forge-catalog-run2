import { ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ProductRepositoryFake } from './product.repository.fake.generated';
import { ProductService } from './product.service.owned';

const input = {
  sku: 'SKU-1',
  name: 'Producto',
  price: '10.00',
  categoryId: '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b',
};

function setup() {
  const repo = new ProductRepositoryFake();
  return { repo, service: new ProductService(repo) };
}

describe('REQ-001', () => {
  it('REQ-001.AC1 crea un producto y lo devuelve', async () => {
    const { service } = setup();
    const out = await service.create(input);
    expect(out.id).toBeTypeOf('string');
    expect(out.sku).toBe('SKU-1');
    expect(out.name).toBe('Producto');
  });

  it('REQ-001.AC2 rechaza sku duplicado con conflicto y no crea nada', async () => {
    const { repo, service } = setup();
    await service.create(input);
    await expect(
      service.create({ ...input, name: 'Otro' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(await repo.list()).toHaveLength(1);
  });
});
