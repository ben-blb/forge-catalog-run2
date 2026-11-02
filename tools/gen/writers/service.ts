import { pascal } from '../names.ts';
import type { Entity, Model } from '../types.ts';
import { entityOf, HEADER } from './shared.ts';

export function serviceBase(e: Entity, model: Model): string {
  const N = e.name;
  const has = (op: string) => e.ops.includes(op as never);
  const dtoTypes = [
    ...(has('create') ? [`${N}Create`] : []),
    ...(has('update') ? [`${N}Update`] : []),
    ...e.actions.map((a) => `${N}${pascal(a.name)}Input`),
  ];
  const methods: string[] = [];
  if (has('create'))
    methods.push(
      `  create(data: ${N}Create) {\n    return this.repo.create(data);\n  }`,
    );
  if (has('read') || has('update') || has('delete')) {
    methods.push(
      `  async read(id: string) {\n    const row = await this.repo.findById(id);\n    if (!row) throw new NotFoundException();\n    return row;\n  }`,
    );
  }
  if (has('list'))
    methods.push('  list() {\n    return this.repo.list();\n  }');
  if (has('update')) {
    methods.push(
      `  async update(id: string, data: ${N}Update) {\n    await this.read(id);\n    return this.repo.update(id, data);\n  }`,
    );
  }
  if (has('delete')) {
    methods.push(
      `  async delete(id: string) {\n    await this.read(id);\n    await this.repo.delete(id);\n  }`,
    );
  }
  for (const a of e.actions) {
    methods.push(
      `  abstract ${a.name}(id: string, input: ${N}${pascal(a.name)}Input): Promise<${a.out}Row>;`,
    );
  }
  const outs = [...new Set(e.actions.map((a) => a.out).filter((o) => o !== N))];
  const outImports = outs.map((o) => outImport(model, o)).join('\n');

  return `${HEADER}
import { Inject, NotFoundException } from '@nestjs/common';
${dtoTypes.length ? `import type { ${dtoTypes.join(', ')} } from './${e.stem}.dto.generated';` : ''}
import { ${N}Repository, type ${N}RepositoryApi${e.actions.some((a) => a.out === N) ? `, type ${N}Row` : ''} } from './${e.stem}.repository.generated';
${outImports}

export abstract class ${N}ServiceBase {
  constructor(@Inject(${N}Repository) protected readonly repo: ${N}RepositoryApi) {}

${methods.join('\n\n')}
}
`;
}

const outImport = (model: Model, name: string) => {
  const o = entityOf(model.entities, name);
  return `import type { ${name}Row } from '../${o.dir}/${o.stem}.repository.generated';`;
};

export function serviceOwned(e: Entity, model: Model): string {
  const N = e.name;
  const inputs = e.actions.map((a) => `${N}${pascal(a.name)}Input`);
  const rows = [...new Set(e.actions.map((a) => `${a.out}Row`))];
  const outs = [...new Set(e.actions.map((a) => a.out).filter((o) => o !== N))];
  const imports = [
    `import { Injectable${e.actions.length ? ', NotImplementedException' : ''} } from '@nestjs/common';`,
    inputs.length
      ? `import type { ${inputs.join(', ')} } from './${e.stem}.dto.generated';`
      : '',
    rows.includes(`${N}Row`)
      ? `import type { ${N}Row } from './${e.stem}.repository.generated';`
      : '',
    ...outs.map((o) => outImport(model, o)),
    `import { ${N}ServiceBase } from './${e.stem}.service.generated';`,
  ].filter(Boolean);
  const stubs = e.actions
    .map(
      (a) =>
        `  async ${a.name}(_id: string, _input: ${N}${pascal(a.name)}Input): Promise<${a.out}Row> {\n    throw new NotImplementedException();\n  }`,
    )
    .join('\n\n');
  return `${imports.join('\n')}

@Injectable()
export class ${N}Service extends ${N}ServiceBase {${stubs ? `\n${stubs}\n` : ''}}
`;
}
