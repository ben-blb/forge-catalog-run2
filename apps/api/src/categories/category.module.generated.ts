// Generado por `make gen`. No editar.

import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller.generated';
import { CategoryRepository } from './category.repository.generated';
import { CategoryService } from './category.service.owned';

@Module({
  controllers: [CategoryController],
  providers: [CategoryRepository, CategoryService],
})
export class CategoryModule {}
