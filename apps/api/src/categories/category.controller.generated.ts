// Generado por `make gen`. No editar.

import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { parse, parseId } from '../parse';
import { CategoryCreate, CategoryResponse } from './category.dto.generated';

import { CategoryService } from './category.service.owned';

@Controller('categories')
export class CategoryController {
  constructor(
    @Inject(CategoryService) private readonly service: CategoryService,
  ) {}

  @Post()
  async create(@Body() body: unknown) {
    const data = parse(CategoryCreate, body);
    return CategoryResponse.parse(await this.service.create(data));
  }

  @Get()
  async list() {
    const rows = await this.service.list();
    return rows.map((r) => CategoryResponse.parse(r));
  }

  @Get(':id')
  async read(@Param('id') id: string) {
    return CategoryResponse.parse(await this.service.read(parseId(id)));
  }
}
