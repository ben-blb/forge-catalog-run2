// Generado por `make gen`. No editar.

import { randomUUID } from 'node:crypto';
import type { CategoryCreate, CategoryUpdate } from './category.dto.generated';
import type {
  CategoryRepositoryApi,
  CategoryRow,
} from './category.repository.generated';

/** Repository en memoria con la misma interfaz que el real. Sólo para tests. */
export class CategoryRepositoryFake implements CategoryRepositoryApi {
  private rows: CategoryRow[] = [];

  async create(data: CategoryCreate) {
    const row = { ...data, id: randomUUID() } as unknown as CategoryRow;
    this.rows.push(row);
    return row;
  }

  async findById(id: string) {
    return this.rows.find((r) => r.id === id) ?? null;
  }

  async findByName(name: string) {
    return this.rows.find((r) => r.name === name) ?? null;
  }
  async list() {
    return [...this.rows];
  }

  async update(id: string, data: CategoryUpdate) {
    const row = this.rows.find((r) => r.id === id);
    if (!row) throw new Error('not found');
    Object.assign(row, data);
    return row;
  }

  async delete(id: string) {
    this.rows = this.rows.filter((r) => r.id !== id);
  }
}
