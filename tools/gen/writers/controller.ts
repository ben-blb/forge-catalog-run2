import { pascal } from '../names.ts';
import type { Entity, Model } from '../types.ts';
import { entityOf, HEADER } from './shared.ts';

export function controller(e: Entity, model: Model): string {
  const N = e.name;
  const has = (op: string) => e.ops.includes(op as never);

  const dtoNames = [
    `${N}Response`,
    ...(has('create') ? [`${N}Create`] : []),
    ...(has('update') ? [`${N}Update`] : []),
    ...e.actions.map((a) => `${N}${pascal(a.name)}Input`),
  ];
  const outImports = [
    ...new Set(e.actions.map((a) => a.out).filter((o) => o !== N)),
  ].map((o) => {
    const x = entityOf(model.entities, o);
    return `import { ${o}Response } from '../${x.dir}/${x.stem}.dto.generated';`;
  });
  const needsId =
    has('read') || has('update') || has('delete') || e.actions.length > 0;
  const needsBody = has('create') || has('update') || e.actions.length > 0;
  const nest = [
    ...(needsBody ? ['Body'] : []),
    'Controller',
    ...(has('delete') ? ['Delete'] : []),
    ...(has('read') || has('list') ? ['Get'] : []),
    ...(has('delete') || e.actions.length ? ['HttpCode'] : []),
    'Inject',
    ...(needsId ? ['Param'] : []),
    ...(has('update') ? ['Patch'] : []),
    ...(has('create') || e.actions.length ? ['Post'] : []),
  ];

  const m: string[] = [];
  if (has('create')) {
    m.push(`  @Post()
  async create(@Body() body: unknown) {
    const data = parse(${N}Create, body);
    return ${N}Response.parse(await this.service.create(data));
  }`);
  }
  if (has('list')) {
    m.push(`  @Get()
  async list() {
    const rows = await this.service.list();
    return rows.map((r) => ${N}Response.parse(r));
  }`);
  }
  if (has('read')) {
    m.push(`  @Get(':id')
  async read(@Param('id') id: string) {
    return ${N}Response.parse(await this.service.read(parseId(id)));
  }`);
  }
  if (has('update')) {
    m.push(`  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const uuid = parseId(id);
    const data = parse(${N}Update, body);
    return ${N}Response.parse(await this.service.update(uuid, data));
  }`);
  }
  if (has('delete')) {
    m.push(`  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    await this.service.delete(parseId(id));
  }`);
  }
  for (const a of e.actions) {
    m.push(`  @Post(':id/${a.name}')
  @HttpCode(200)
  async ${a.name}(@Param('id') id: string, @Body() body: unknown) {
    const uuid = parseId(id);
    const input = parse(${N}${pascal(a.name)}Input, body);
    return ${a.out}Response.parse(await this.service.${a.name}(uuid, input));
  }`);
  }

  return `${HEADER}
import { ${nest.join(', ')} } from '@nestjs/common';
import { parse${needsId ? ', parseId' : ''} } from '../parse';
import { ${dtoNames.join(', ')} } from './${e.stem}.dto.generated';
${outImports.join('\n')}
import { ${N}Service } from './${e.stem}.service.owned';

@Controller('${e.dir}')
export class ${N}Controller {
  constructor(@Inject(${N}Service) private readonly service: ${N}Service) {}

${m.join('\n\n')}
}
`;
}

export function moduleFile(e: Entity): string {
  const N = e.name;
  return `${HEADER}
import { Module } from '@nestjs/common';
import { ${N}Controller } from './${e.stem}.controller.generated';
import { ${N}Repository } from './${e.stem}.repository.generated';
import { ${N}Service } from './${e.stem}.service.owned';

@Module({
  controllers: [${N}Controller],
  providers: [${N}Repository, ${N}Service],
})
export class ${N}Module {}
`;
}

export function modulesFile(model: Model): string {
  const imports = model.entities.map(
    (e) =>
      `import { ${e.name}Module } from './${e.dir}/${e.stem}.module.generated';`,
  );
  const list = model.entities.map((e) => `${e.name}Module`).join(', ');
  return `${HEADER}${imports.join('\n')}${imports.length ? '\n\n' : '\n'}export const modules = [${list}];\n`;
}
