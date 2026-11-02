import { pascal } from '../names.ts';
import type { Entity } from '../types.ts';
import { HEADER } from './shared.ts';

export function repository(e: Entity): string {
  const N = e.name;
  const model = N.charAt(0).toLowerCase() + N.slice(1);
  const finders = e.fields
    .filter((f) => f.unique)
    .map(
      (f) => `
  async findBy${pascal(f.name)}(${f.name}: ${f.type.kind === 'int' ? 'number' : 'string'}): Promise<${N}Row | null> {
    return this.prisma.${model}.findUnique({ where: { ${f.name} } });
  }`,
    )
    .join('\n');

  return `${HEADER}
import { Inject, Injectable } from '@nestjs/common';
import type { ${N} as ${N}Row } from '../../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import type { ${N}Create, ${N}Update } from './${e.stem}.dto.generated';

export type { ${N}Row };

@Injectable()
export class ${N}Repository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(data: ${N}Create): Promise<${N}Row> {
    return this.prisma.${model}.create({ data });
  }

  async findById(id: string): Promise<${N}Row | null> {
    return this.prisma.${model}.findUnique({ where: { id } });
  }
${finders}
  async list(): Promise<${N}Row[]> {
    return this.prisma.${model}.findMany();
  }

  async update(id: string, data: ${N}Update): Promise<${N}Row> {
    return this.prisma.${model}.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.${model}.delete({ where: { id } });
  }
}

/** Superficie pública del repository; el fake de tests la implementa. */
export type ${N}RepositoryApi = Pick<${N}Repository, keyof ${N}Repository>;
`;
}
