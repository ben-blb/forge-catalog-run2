import { pascal } from '../names.ts';
import { type Entity, isPublic, type Model } from '../types.ts';
import { createFields, HEADER, zodIn, zodOut } from './shared.ts';

export function dto(e: Entity, _model: Model): string {
  const N = e.name;
  const obj = (fields: string[]) => `z.object({\n${fields.join('\n')}\n})`;
  const usesJson = [
    ...createFields(e),
    ...e.actions.flatMap((a) => a.input),
  ].some((f) => f.type.kind === 'json');
  const lines: string[] = [
    HEADER,
    ...(usesJson
      ? ["import type { Prisma } from '../../generated/prisma/client';"]
      : []),
    "import { z } from 'zod';\n",
  ];

  lines.push(
    `export const ${N}Create = ${obj(createFields(e).map((f) => `  ${f.name}: ${zodIn(f)},`))};`,
    `export type ${N}Create = z.output<typeof ${N}Create>;`,
    `export const ${N}Update = ${N}Create.partial();`,
    `export type ${N}Update = z.output<typeof ${N}Update>;`,
  );
  for (const a of e.actions) {
    const name = `${N}${pascal(a.name)}Input`;
    lines.push(
      `export const ${name} = ${obj(a.input.map((f) => `  ${f.name}: ${zodIn(f)},`))};`,
      `export type ${name} = z.output<typeof ${name}>;`,
    );
  }
  lines.push(
    `export const ${N}Response = ${obj(e.fields.filter(isPublic).map((f) => `  ${f.name}: ${zodOut(f)},`))};`,
    `export type ${N}Response = z.output<typeof ${N}Response>;`,
  );
  return `${lines.join('\n')}\n`;
}
