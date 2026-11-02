import { camel, pascal, plural } from '../names.ts';
import type { Entity, Field, Model } from '../types.ts';

const SCALAR: Record<string, string> = {
  string: 'String',
  text: 'String @db.Text',
  int: 'Int',
  decimal: 'Decimal',
  bool: 'Boolean',
  date: 'DateTime @db.Date',
  datetime: 'DateTime',
  uuid: 'String @db.Uuid',
  json: 'Json',
};

const enumName = (e: Entity, f: Field) => `${e.name}${pascal(f.name)}`;

function prismaType(e: Entity, f: Field): string {
  const t = f.type;
  if (t.kind === 'enum') return enumName(e, f);
  if (t.kind === 'ref') return SCALAR.uuid as string;
  return SCALAR[t.kind] as string;
}

function field(e: Entity, f: Field): string[] {
  const [base, ...attrs] = prismaType(e, f).split(' ');
  const opt = f.optional ? '?' : '';
  const out = [base + opt, ...attrs];
  if (f.pk) out.push('@id', '@default(uuid())');
  if (f.unique) out.push('@unique');
  const lines = [`  ${f.name} ${out.join(' ')}`];
  if (f.type.kind === 'ref') {
    const rel = f.name.slice(0, -2);
    lines.push(
      `  ${rel} ${f.type.entity}${opt} @relation("${e.name}_${rel}", fields: [${f.name}], references: [id])`,
    );
  }
  return lines;
}

export function prismaSchema(model: Model): string {
  const blocks = ['datasource db {\n  provider = "postgresql"\n}'];
  for (const e of model.entities) {
    for (const f of e.fields) {
      if (f.type.kind !== 'enum') continue;
      blocks.push(
        `enum ${enumName(e, f)} {\n${f.type.values.map((v) => `  ${v}`).join('\n')}\n}`,
      );
    }
  }
  for (const e of model.entities) {
    const lines = e.fields.flatMap((f) => field(e, f));
    for (const o of model.entities) {
      for (const f of o.fields) {
        if (f.type.kind === 'ref' && f.type.entity === e.name) {
          lines.push(
            `  ${camel(plural(o.name))} ${o.name}[] @relation("${o.name}_${f.name.slice(0, -2)}")`,
          );
        }
      }
    }
    for (const f of e.fields.filter((x) => x.index))
      lines.push(`  @@index([${f.name}])`);
    blocks.push(`model ${e.name} {\n${lines.join('\n')}\n}`);
  }
  return `// Generado por \`make gen\`. No editar.\n${blocks.join('\n\n')}\n`;
}
