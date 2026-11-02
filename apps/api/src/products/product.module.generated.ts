// Generado por `make gen`. No editar.

import { Module } from '@nestjs/common';
import { ProductController } from './product.controller.generated';
import { ProductRepository } from './product.repository.generated';
import { ProductService } from './product.service.owned';

@Module({
  controllers: [ProductController],
  providers: [ProductRepository, ProductService],
})
export class ProductModule {}
