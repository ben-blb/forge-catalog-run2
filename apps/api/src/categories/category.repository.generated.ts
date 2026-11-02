// Generado por `make gen`. No editar.

import { Inject, Injectable } from '@nestjs/common';
import type { Category as CategoryRow } from '../../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import type { CategoryCreate, CategoryUpdate } from './category.dto.generated';

export type { CategoryRow };

@Injectable()
export class CategoryRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(data: CategoryCreate): Promise<CategoryRow> {
    return this.prisma.category.create({ data });
  }

  async findById(id: string): Promise<CategoryRow | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<CategoryRow | null> {
    return this.prisma.category.findUnique({ where: { name } });
  }
  async list(): Promise<CategoryRow[]> {
    return this.prisma.category.findMany();
  }

  async update(id: string, data: CategoryUpdate): Promise<CategoryRow> {
    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}

/** Superficie pública del repository; el fake de tests la implementa. */
export type CategoryRepositoryApi = Pick<
  CategoryRepository,
  keyof CategoryRepository
>;
