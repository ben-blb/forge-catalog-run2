import { Injectable, NotImplementedException } from '@nestjs/common';
import type { ProductDiscontinueInput } from './product.dto.generated';
import type { ProductRow } from './product.repository.generated';
import { ProductServiceBase } from './product.service.generated';

@Injectable()
export class ProductService extends ProductServiceBase {
  async discontinue(
    _id: string,
    _input: ProductDiscontinueInput,
  ): Promise<ProductRow> {
    throw new NotImplementedException();
  }
}
