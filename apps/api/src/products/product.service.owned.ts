import {
  ConflictException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import type {
  ProductCreate,
  ProductDiscontinueInput,
} from './product.dto.generated';
import type { ProductRow } from './product.repository.generated';
import { ProductServiceBase } from './product.service.generated';

@Injectable()
export class ProductService extends ProductServiceBase {
  override async create(data: ProductCreate) {
    if (await this.repo.findBySku(data.sku)) {
      throw new ConflictException('SKU duplicado');
    }
    return super.create(data);
  }

  async discontinue(
    _id: string,
    _input: ProductDiscontinueInput,
  ): Promise<ProductRow> {
    throw new NotImplementedException();
  }
}
