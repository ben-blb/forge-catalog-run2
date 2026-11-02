import { Injectable } from '@nestjs/common';
import { CategoryServiceBase } from './category.service.generated';

@Injectable()
export class CategoryService extends CategoryServiceBase {}
