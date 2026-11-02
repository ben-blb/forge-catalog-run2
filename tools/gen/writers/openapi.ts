import { stringify } from 'yaml';
import { pascal } from '../names.ts';
import {
  type Entity,
  type Field,
  type FieldType,
  isPublic,
  type Model,
} from '../types.ts';
import { createFields } from './shared.ts';

type Json = Record<string, unknown>;

function schemaOf(t: FieldType): Json {
  switch (t.kind) {
    case 'string':
    case 'text':
      return { type: 'string' };
    case 'int':
      return { type: 'integer' };
    case 'decimal':
      return { type: 'string', pattern: '^-?\\d+(\\.\\d+)?$' };
    case 'bool':
      return { type: 'boolean' };
    case 'date':
      return { type: 'string', format: 'date' };
    case 'datetime':
      return { type: 'string', format: 'date-time' };
    case 'uuid':
    case 'ref':
      return { type: 'string', format: 'uuid' };
    case 'json':
      return {};
    case 'enum':
      return { type: 'string', enum: t.values };
  }
}

const nullable = (f: Field, s: Json): Json =>
  f.optional ? { oneOf: [s, { type: 'null' }] } : s;

function object(fields: Field[], forInput: boolean): Json {
  const required = fields
    .filter((f) => !f.optional && !(forInput && f.pk))
    .map((f) => f.name);
  return {
    type: 'object',
    properties: Object.fromEntries(
      fields.map((f) => [f.name, nullable(f, schemaOf(f.type))]),
    ),
    ...(required.length ? { required } : {}),
  };
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const body = (name: string) => ({
  required: true,
  content: { 'application/json': { schema: ref(name) } },
});
const ok = (code: string, schema?: Json) => ({
  [code]: schema
    ? { description: 'OK', content: { 'application/json': { schema } } }
    : { description: 'Sin contenido' },
  '400': { description: 'Input inválido' },
});
const idParam = [
  {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  },
];

function paths(e: Entity): Json {
  const has = (op: string) => e.ops.includes(op as never);
  const N = e.name;
  const op = (summary: string, extra: Json): Json => ({
    summary,
    'x-req': e.xReq,
    ...extra,
  });
  const collection: Json = {};
  const item: Json = {};
  if (has('create'))
    collection.post = op(`Crear ${N}`, {
      requestBody: body(`${N}Create`),
      responses: ok('201', ref(N)),
    });
  if (has('list'))
    collection.get = op(`Listar ${N}`, {
      responses: ok('200', { type: 'array', items: ref(N) }),
    });
  if (has('read'))
    item.get = op(`Leer ${N}`, {
      parameters: idParam,
      responses: { ...ok('200', ref(N)), '404': { description: 'No existe' } },
    });
  if (has('update'))
    item.patch = op(`Actualizar ${N}`, {
      parameters: idParam,
      requestBody: body(`${N}Update`),
      responses: { ...ok('200', ref(N)), '404': { description: 'No existe' } },
    });
  if (has('delete'))
    item.delete = op(`Eliminar ${N}`, {
      parameters: idParam,
      responses: { ...ok('204'), '404': { description: 'No existe' } },
    });

  const out: Json = {};
  if (Object.keys(collection).length) out[`/${e.dir}`] = collection;
  if (Object.keys(item).length) out[`/${e.dir}/{id}`] = item;
  for (const a of e.actions) {
    out[`/${e.dir}/{id}/${a.name}`] = {
      post: {
        summary: `${pascal(a.name)} ${N}`,
        'x-req': a.xReq,
        parameters: idParam,
        requestBody: body(`${N}${pascal(a.name)}Input`),
        responses: {
          ...ok('200', ref(a.out)),
          '404': { description: 'No existe' },
        },
      },
    };
  }
  return out;
}

export function openapi(model: Model): string {
  const schemas: Json = {};
  for (const e of model.entities) {
    schemas[e.name] = object(e.fields.filter(isPublic), false);
    schemas[`${e.name}Create`] = object(createFields(e), true);
    schemas[`${e.name}Update`] = {
      ...object(createFields(e), true),
      required: undefined,
    };
    for (const a of e.actions)
      schemas[`${e.name}${pascal(a.name)}Input`] = object(a.input, true);
  }
  const doc = {
    openapi: '3.1.0',
    info: { title: 'API', version: '1' },
    paths: Object.assign({}, ...model.entities.map(paths)),
    components: { schemas },
  };
  return `# Generado por \`make gen\`. No editar.\n${stringify(doc)}`;
}
