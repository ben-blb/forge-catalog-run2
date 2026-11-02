// Generado por `make gen`. No editar.

import { Inject, Injectable } from '@nestjs/common';
import type { Product as ProductRow } from '../../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import type { ProductCreate, ProductUpdate } from './product.dto.generated';

export type { ProductRow };

@Injectable()
export class ProductRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(data: ProductCreate): Promise<ProductRow> {
    return this.prisma.product.create({ data });
  }

  async findById(id: string): Promise<ProductRow | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async findBySku(sku: string): Promise<ProductRow | null> {
    return this.prisma.product.findUnique({ where: { sku } });
  }
  async list(): Promise<ProductRow[]> {
    return this.prisma.product.findMany();
  }

  async update(id: string, data: ProductUpdate): Promise<ProductRow> {
    return this.prisma.product.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }
}

/** Superficie pública del repository; el fake de tests la implementa. */
export type ProductRepositoryApi = Pick<
  ProductRepository,
  keyof ProductRepository
>;
