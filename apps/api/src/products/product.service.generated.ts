// Generado por `make gen`. No editar.

import { Inject, NotFoundException } from '@nestjs/common';
import type {
  ProductCreate,
  ProductDiscontinueInput,
  ProductUpdate,
} from './product.dto.generated';
import {
  ProductRepository,
  type ProductRepositoryApi,
  type ProductRow,
} from './product.repository.generated';

export abstract class ProductServiceBase {
  constructor(
    @Inject(ProductRepository) protected readonly repo: ProductRepositoryApi,
  ) {}

  create(data: ProductCreate) {
    return this.repo.create(data);
  }

  async read(id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException();
    return row;
  }

  list() {
    return this.repo.list();
  }

  async update(id: string, data: ProductUpdate) {
    await this.read(id);
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    await this.read(id);
    await this.repo.delete(id);
  }

  abstract discontinue(
    id: string,
    input: ProductDiscontinueInput,
  ): Promise<ProductRow>;
}
