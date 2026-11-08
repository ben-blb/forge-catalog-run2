// Generado por `make gen`. No editar.

import { randomUUID } from 'node:crypto';
import type { ProductCreate, ProductUpdate } from './product.dto.generated';
import type {
  ProductRepositoryApi,
  ProductRow,
} from './product.repository.generated';

/** Repository en memoria con la misma interfaz que el real. Sólo para tests. */
export class ProductRepositoryFake implements ProductRepositoryApi {
  private rows: ProductRow[] = [];

  async create(data: ProductCreate) {
    const row = {
      stock: null,
      discontinuedAt: null,
      discontinueReason: null,
      supplierEmail: null,
      ...data,
      id: randomUUID(),
    } as unknown as ProductRow;
    this.rows.push(row);
    return row;
  }

  async findById(id: string) {
    return this.rows.find((r) => r.id === id) ?? null;
  }

  async findBySku(sku: string) {
    return this.rows.find((r) => r.sku === sku) ?? null;
  }
  async list() {
    return [...this.rows];
  }

  async update(id: string, data: ProductUpdate) {
    const row = this.rows.find((r) => r.id === id);
    if (!row) throw new Error('not found');
    Object.assign(row, data);
    return row;
  }

  async delete(id: string) {
    this.rows = this.rows.filter((r) => r.id !== id);
  }
}
