import { kebab, plural } from './names.ts';
import {
  type Action,
  type Entity,
  type Field,
  type FieldType,
  MODIFIERS,
  type Model,
  OPS,
  type Op,
  SCALARS,
  type Scalar,
} from './types.ts';

export class IrError extends Error {}

const fail = (where: string, msg: string): never => {
  throw new IrError(`${where}: ${msg}`);
};

const IDENT = /^[A-Za-z][A-Za-z0-9_]*$/;

function parseType(where: string, token: string, rest: string[]): FieldType {
  const enumMatch = token.match(/^enum\((.+)\)$/);
  if (enumMatch) {
    const values = (enumMatch[1] ?? '').split('|');
    for (const v of values) {
      if (!IDENT.test(v)) fail(where, `valor de enum inválido '${v}'`);
    }
    return { kind: 'enum', values };
  }
  if (token === 'ref') {
    const entity = rest.shift();
    if (!entity) fail(where, "'ref' necesita el nombre de una entidad");
    return { kind: 'ref', entity: entity as string };
  }
  if (!(SCALARS as readonly string[]).includes(token)) {
    fail(where, `tipo desconocido '${token}'`);
  }
  return { kind: token as Scalar };
}

function parseField(where: string, name: string, spec: unknown): Field {
  if (typeof spec !== 'string')
    fail(where, 'debe ser un string "<tipo> <modificadores>"');
  const tokens = (spec as string).trim().split(/\s+/);
  const type = parseType(where, tokens.shift() ?? '', tokens);
  const field: Field = {
    name,
    type,
    pk: false,
    unique: false,
    optional: false,
    index: false,
    pii: false,
    secret: false,
  };
  for (const m of tokens) {
    if (!(MODIFIERS as readonly string[]).includes(m)) {
      fail(where, `modificador desconocido '${m}'`);
    }
    field[m as (typeof MODIFIERS)[number]] = true;
  }
  return field;
}

function parseXReq(where: string, value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    !value.every((v) => typeof v === 'string')
  ) {
    return fail(where, "falta 'x-req' (lista no vacía de REQ-*)");
  }
  return value as string[];
}

function parseAction(
  where: string,
  name: string,
  raw: Record<string, unknown>,
): Action {
  const xReq = parseXReq(`${where}.x-req`, raw['x-req']);
  const input = Object.entries((raw.in ?? {}) as Record<string, unknown>).map(
    ([n, spec]) => {
      const f = parseField(`${where}.in.${n}`, n, spec);
      if (f.type.kind === 'ref')
        fail(`${where}.in.${n}`, "'ref' no se permite en inputs");
      if (f.pk || f.unique || f.index || f.pii || f.secret) {
        fail(`${where}.in.${n}`, "sólo se permite el modificador 'optional'");
      }
      return f;
    },
  );
  if (typeof raw.out !== 'string')
    fail(`${where}.out`, 'falta la entidad de salida');
  return { name, xReq, input, out: raw.out as string };
}

// Recibe el IR ya parseado como YAML: así forge lo reutiliza con su propio `yaml`.
export function parseIr(input: unknown): Model {
  const doc = (input ?? {}) as Record<string, unknown>;
  if (doc.ir !== 1) fail('ir', "se espera 'ir: 1'");
  const rawEntities = (doc.entities ?? {}) as Record<
    string,
    Record<string, unknown>
  >;

  const entities: Entity[] = Object.entries(rawEntities).map(([name, raw]) => {
    if (!/^[A-Z][A-Za-z0-9]*$/.test(name))
      fail(name, 'el nombre debe ser PascalCase');
    const xReq = parseXReq(`${name}.x-req`, raw['x-req']);

    const fields = Object.entries(
      (raw.fields ?? {}) as Record<string, unknown>,
    ).map(([n, spec]) => {
      if (!IDENT.test(n)) fail(`${name}.${n}`, 'nombre de campo inválido');
      return parseField(`${name}.${n}`, n, spec);
    });
    const pks = fields.filter((f) => f.pk);
    if (pks.length !== 1) fail(name, "debe tener exactamente un campo 'pk'");
    const pk = pks[0] as Field;
    if (pk.type.kind !== 'uuid' || pk.optional) {
      fail(`${name}.${pk.name}`, "'pk' debe ser 'uuid' y no 'optional'");
    }

    const ops = ((raw.ops ?? []) as string[]).map((op) => {
      if (!(OPS as readonly string[]).includes(op))
        fail(`${name}.ops`, `op desconocida '${op}'`);
      return op as Op;
    });

    const actions = Object.entries(
      (raw.actions ?? {}) as Record<string, Record<string, unknown>>,
    ).map(([n, a]) => parseAction(`${name}.actions.${n}`, n, a));

    return {
      name,
      stem: kebab(name),
      dir: kebab(plural(name)),
      xReq,
      fields,
      ops,
      actions,
    };
  });

  const names = new Set(entities.map((e) => e.name));
  const seenRefs = new Set<string>();
  for (const e of entities) {
    for (const f of e.fields) {
      if (f.type.kind !== 'ref') continue;
      const where = `${e.name}.${f.name}`;
      if (!names.has(f.type.entity))
        fail(where, `ref a la entidad inexistente '${f.type.entity}'`);
      if (!f.name.endsWith('Id') || f.name.length === 2) {
        fail(where, "un campo 'ref' debe llamarse '<relación>Id'");
      }
      const key = `${e.name}->${f.type.entity}`;
      if (seenRefs.has(key))
        fail(where, `ya existe otro ref de ${e.name} a ${f.type.entity}`);
      seenRefs.add(key);
    }
    for (const a of e.actions) {
      if (!names.has(a.out))
        fail(
          `${e.name}.actions.${a.name}.out`,
          `entidad inexistente '${a.out}'`,
        );
    }
  }
  return { entities };
}
