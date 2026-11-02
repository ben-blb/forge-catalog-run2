// Generado por `make gen`. No editar.

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { parse, parseId } from '../parse';
import {
  ProductCreate,
  ProductDiscontinueInput,
  ProductResponse,
  ProductUpdate,
} from './product.dto.generated';

import { ProductService } from './product.service.owned';

@Controller('products')
export class ProductController {
  constructor(
    @Inject(ProductService) private readonly service: ProductService,
  ) {}

  @Post()
  async create(@Body() body: unknown) {
    const data = parse(ProductCreate, body);
    return ProductResponse.parse(await this.service.create(data));
  }

  @Get()
  async list() {
    const rows = await this.service.list();
    return rows.map((r) => ProductResponse.parse(r));
  }

  @Get(':id')
  async read(@Param('id') id: string) {
    return ProductResponse.parse(await this.service.read(parseId(id)));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const uuid = parseId(id);
    const data = parse(ProductUpdate, body);
    return ProductResponse.parse(await this.service.update(uuid, data));
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    await this.service.delete(parseId(id));
  }

  @Post(':id/discontinue')
  @HttpCode(200)
  async discontinue(@Param('id') id: string, @Body() body: unknown) {
    const uuid = parseId(id);
    const input = parse(ProductDiscontinueInput, body);
    return ProductResponse.parse(await this.service.discontinue(uuid, input));
  }
}
