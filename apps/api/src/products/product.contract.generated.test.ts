// Generado por `make gen`. No editar.

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ProductController } from './product.controller.generated';
import { ProductCreate } from './product.dto.generated';
import { ProductRepositoryFake } from './product.repository.fake.generated';
import { ProductService } from './product.service.owned';

const MISSING = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b';
const valid = {
  sku: 'x',
  name: 'x',
  price: '1.50',
  categoryId: '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b',
  discontinuedAt: '2024-01-31T12:00:00.000Z',
  discontinueReason: 'x',
  supplierEmail: 'x',
};

function setup() {
  const repo = new ProductRepositoryFake();
  return { repo, controller: new ProductController(new ProductService(repo)) };
}

const seed = (repo: ProductRepositoryFake) =>
  repo.create(ProductCreate.parse(valid));

describe('Product contract', () => {
  it('create rechaza input inválido', async () => {
    const { controller } = setup();
    await expect(controller.create(null)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('create devuelve el registro', async () => {
    const { controller } = setup();
    const out = await controller.create(valid);
    expect(out.id).toBeTypeOf('string');
  });

  it('read devuelve el registro, 404 si no existe, 400 si el id es inválido', async () => {
    const { repo, controller } = setup();
    const row = await seed(repo);
    expect((await controller.read(row.id)).id).toBe(row.id);
    await expect(controller.read(MISSING)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(controller.read('no-es-uuid')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('list devuelve los registros', async () => {
    const { repo, controller } = setup();
    await seed(repo);
    expect(await controller.list()).toHaveLength(1);
  });

  it('update rechaza input inválido y aplica el válido', async () => {
    const { repo, controller } = setup();
    const row = await seed(repo);
    await expect(controller.update(row.id, null)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect((await controller.update(row.id, {})).id).toBe(row.id);
    await expect(controller.update(MISSING, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('delete elimina el registro', async () => {
    const { repo, controller } = setup();
    const row = await seed(repo);
    await controller.delete(row.id);
    expect(await repo.findById(row.id)).toBeNull();
    await expect(controller.delete(MISSING)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('la respuesta no trae campos pii/secret', async () => {
    const { repo, controller } = setup();
    const row = await seed(repo);
    const out = await controller.read(row.id);
    for (const key of ['supplierEmail']) expect(out).not.toHaveProperty(key);
    expect(out).toHaveProperty('id', row.id);
  });

  it('discontinue rechaza input inválido', async () => {
    const { controller } = setup();
    await expect(controller.discontinue(MISSING, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
