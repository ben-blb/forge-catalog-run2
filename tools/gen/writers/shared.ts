import { type Entity, type Field, type FieldType, isPublic } from '../types.ts';

export const HEADER = '// Generado por `make gen`. No editar.\n';

const q = (s: string) => JSON.stringify(s);

/** Zod para datos que entran (create, update, input de action). */
export function zodIn(f: Field): string {
  const base = zodType(f.type, 'in');
  if (!f.optional) return base;
  // Prisma no acepta null plano en Json (pide JsonNull): ahí sólo se omite.
  return f.type.kind === 'json' ? `${base}.optional()` : `${base}.nullish()`;
}

/** Zod para datos que salen (respuesta): Date y Decimal se serializan como string. */
export function zodOut(f: Field): string {
  const base = zodType(f.type, 'out');
  return f.optional ? `${base}.nullable()` : base;
}

function zodType(t: FieldType, dir: 'in' | 'out'): string {
  switch (t.kind) {
    case 'string':
    case 'text':
      return 'z.string()';
    case 'int':
      return 'z.int()';
    case 'decimal':
      return dir === 'in'
        ? 'z.string().regex(/^-?\\d+(\\.\\d+)?$/)'
        : 'z.coerce.string()';
    case 'bool':
      return 'z.boolean()';
    case 'date':
      return dir === 'in'
        ? 'z.iso.date().pipe(z.coerce.date())'
        : 'z.date().transform((d) => d.toISOString().slice(0, 10))';
    case 'datetime':
      return dir === 'in'
        ? 'z.iso.datetime().pipe(z.coerce.date())'
        : 'z.date().transform((d) => d.toISOString())';
    case 'uuid':
    case 'ref':
      return 'z.uuid()';
    case 'json':
      return dir === 'in'
        ? "z.custom<Prisma.InputJsonValue>((v) => v !== null && z.json().safeParse(v).success, 'JSON inválido')"
        : 'z.json()';
    case 'enum':
      return `z.enum([${t.values.map(q).join(', ')}])`;
  }
}

/** Tipo TypeScript del lado JSON (lo que viaja por HTTP). */
export function tsType(t: FieldType): string {
  switch (t.kind) {
    case 'int':
      return 'number';
    case 'bool':
      return 'boolean';
    case 'json':
      return 'unknown';
    case 'enum':
      return t.values.map(q).join(' | ');
    default:
      return 'string';
  }
}

/** Campos que acepta create: todo menos la pk. */
export const createFields = (e: Entity) => e.fields.filter((f) => !f.pk);
export const publicFields = (e: Entity) => e.fields.filter(isPublic);
export const entityOf = (all: Entity[], name: string) =>
  all.find((e) => e.name === name) as Entity;
