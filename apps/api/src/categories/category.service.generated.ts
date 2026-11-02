// Generado por `make gen`. No editar.

import { Inject, NotFoundException } from '@nestjs/common';
import type { CategoryCreate } from './category.dto.generated';
import {
  CategoryRepository,
  type CategoryRepositoryApi,
} from './category.repository.generated';

export abstract class CategoryServiceBase {
  constructor(
    @Inject(CategoryRepository) protected readonly repo: CategoryRepositoryApi,
  ) {}

  create(data: CategoryCreate) {
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
}
