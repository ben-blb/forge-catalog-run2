import { pascal } from '../names.ts';
import type { Entity } from '../types.ts';
import { HEADER } from './shared.ts';

export function fake(e: Entity): string {
  const N = e.name;
  const nulls = e.fields
    .filter((f) => f.optional)
    .map((f) => `${f.name}: null`);
  const finders = e.fields
    .filter((f) => f.unique)
    .map(
      (f) => `
  async findBy${pascal(f.name)}(${f.name}: ${f.type.kind === 'int' ? 'number' : 'string'}) {
    return this.rows.find((r) => r.${f.name} === ${f.name}) ?? null;
  }`,
    )
    .join('\n');

  return `${HEADER}
import { randomUUID } from 'node:crypto';
import type { ${N}Create, ${N}Update } from './${e.stem}.dto.generated';
import type { ${N}Row, ${N}RepositoryApi } from './${e.stem}.repository.generated';

/** Repository en memoria con la misma interfaz que el real. Sólo para tests. */
export class ${N}RepositoryFake implements ${N}RepositoryApi {
  private rows: ${N}Row[] = [];

  async create(data: ${N}Create) {
    const row = { ${[...nulls, '...data', 'id: randomUUID()'].join(', ')} } as unknown as ${N}Row;
    this.rows.push(row);
    return row;
  }

  async findById(id: string) {
    return this.rows.find((r) => r.id === id) ?? null;
  }
${finders}
  async list() {
    return [...this.rows];
  }

  async update(id: string, data: ${N}Update) {
    const row = this.rows.find((r) => r.id === id);
    if (!row) throw new Error('not found');
    Object.assign(row, data);
    return row;
  }

  async delete(id: string) {
    this.rows = this.rows.filter((r) => r.id !== id);
  }
}
`;
}
