// Generado por `make gen`. No editar.

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { CategoryController } from './category.controller.generated';
import { CategoryCreate } from './category.dto.generated';
import { CategoryRepositoryFake } from './category.repository.fake.generated';
import { CategoryService } from './category.service.owned';

const MISSING = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b';
const valid = { name: 'x' };

function setup() {
  const repo = new CategoryRepositoryFake();
  return {
    repo,
    controller: new CategoryController(new CategoryService(repo)),
  };
}

const seed = (repo: CategoryRepositoryFake) =>
  repo.create(CategoryCreate.parse(valid));

describe('Category contract', () => {
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
});
