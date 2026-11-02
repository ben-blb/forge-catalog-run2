import { type Entity, type Field, isPublic } from '../types.ts';
import { createFields, HEADER } from './shared.ts';

const UUID = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b';

function sample(f: Field): unknown {
  const t = f.type;
  switch (t.kind) {
    case 'int':
      return 1;
    case 'decimal':
      return '1.50';
    case 'bool':
      return true;
    case 'date':
      return '2024-01-31';
    case 'datetime':
      return '2024-01-31T12:00:00.000Z';
    case 'uuid':
    case 'ref':
      return UUID;
    case 'json':
      return { a: 1 };
    case 'enum':
      return t.values[0];
    default:
      return 'x';
  }
}

export function contractTest(e: Entity): string {
  const N = e.name;
  const has = (op: string) => e.ops.includes(op as never);
  const valid = Object.fromEntries(
    createFields(e).map((f) => [f.name, sample(f)]),
  );
  const hidden = e.fields.filter((f) => !isPublic(f)).map((f) => f.name);

  const t: string[] = [];
  if (has('create')) {
    t.push(`  it('create rechaza input inválido', async () => {
    const { controller } = setup();
    await expect(controller.create(null)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create devuelve el registro', async () => {
    const { controller } = setup();
    const out = await controller.create(valid);
    expect(out.id).toBeTypeOf('string');
  });`);
  }
  if (has('read')) {
    t.push(`  it('read devuelve el registro, 404 si no existe, 400 si el id es inválido', async () => {
    const { repo, controller } = setup();
    const row = await seed(repo);
    expect((await controller.read(row.id)).id).toBe(row.id);
    await expect(controller.read(MISSING)).rejects.toBeInstanceOf(NotFoundException);
    await expect(controller.read('no-es-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });`);
  }
  if (has('list')) {
    t.push(`  it('list devuelve los registros', async () => {
    const { repo, controller } = setup();
    await seed(repo);
    expect(await controller.list()).toHaveLength(1);
  });`);
  }
  if (has('update')) {
    t.push(`  it('update rechaza input inválido y aplica el válido', async () => {
    const { repo, controller } = setup();
    const row = await seed(repo);
    await expect(controller.update(row.id, null)).rejects.toBeInstanceOf(BadRequestException);
    expect((await controller.update(row.id, {})).id).toBe(row.id);
    await expect(controller.update(MISSING, {})).rejects.toBeInstanceOf(NotFoundException);
  });`);
  }
  if (has('delete')) {
    t.push(`  it('delete elimina el registro', async () => {
    const { repo, controller } = setup();
    const row = await seed(repo);
    await controller.delete(row.id);
    expect(await repo.findById(row.id)).toBeNull();
    await expect(controller.delete(MISSING)).rejects.toBeInstanceOf(NotFoundException);
  });`);
  }
  if (hidden.length) {
    const via = has('read')
      ? 'controller.read(row.id)'
      : has('list')
        ? '(await controller.list())[0]'
        : has('create')
          ? 'controller.create(valid)'
          : null;
    if (via) {
      t.push(`  it('la respuesta no trae campos pii/secret', async () => {
    const { repo, controller } = setup();
    const row = await seed(repo);
    const out = await ${via};
    for (const key of ${JSON.stringify(hidden)}) expect(out).not.toHaveProperty(key);
    expect(out).toHaveProperty('id', ${has('create') && !has('read') && !has('list') ? 'expect.any(String)' : 'row.id'});
  });`);
    }
  }
  for (const a of e.actions) {
    if (!a.input.some((f) => !f.optional)) continue;
    t.push(`  it('${a.name} rechaza input inválido', async () => {
    const { controller } = setup();
    await expect(controller.${a.name}(MISSING, {})).rejects.toBeInstanceOf(BadRequestException);
  });`);
  }

  const nestErrors = [
    'BadRequestException',
    ...(has('read') || has('update') || has('delete')
      ? ['NotFoundException']
      : []),
  ];
  return `${HEADER}
import { ${nestErrors.join(', ')} } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ${N}Controller } from './${e.stem}.controller.generated';
import { ${N}Create } from './${e.stem}.dto.generated';
import { ${N}RepositoryFake } from './${e.stem}.repository.fake.generated';
import { ${N}Service } from './${e.stem}.service.owned';

const MISSING = '${UUID}';
const valid = ${JSON.stringify(valid)};

function setup() {
  const repo = new ${N}RepositoryFake();
  return { repo, controller: new ${N}Controller(new ${N}Service(repo)) };
}

const seed = (repo: ${N}RepositoryFake) => repo.create(${N}Create.parse(valid));

describe('${N} contract', () => {
${t.join('\n\n') || `  it.todo('${N} sin ops: nada que verificar');`}
});
`;
}
