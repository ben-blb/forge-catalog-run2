export const SCALARS = [
  'string',
  'text',
  'int',
  'decimal',
  'bool',
  'date',
  'datetime',
  'uuid',
  'json',
] as const;
export const MODIFIERS = [
  'pk',
  'unique',
  'optional',
  'index',
  'pii',
  'secret',
] as const;
export const OPS = ['create', 'read', 'update', 'delete', 'list'] as const;

export type Scalar = (typeof SCALARS)[number];
export type Modifier = (typeof MODIFIERS)[number];
export type Op = (typeof OPS)[number];

export type FieldType =
  | { kind: Scalar }
  | { kind: 'enum'; values: string[] }
  | { kind: 'ref'; entity: string };

export interface Field {
  name: string;
  type: FieldType;
  pk: boolean;
  unique: boolean;
  optional: boolean;
  index: boolean;
  pii: boolean;
  secret: boolean;
}

export interface Action {
  name: string;
  xReq: string[];
  input: Field[];
  out: string;
}

export interface Entity {
  name: string; // Product
  stem: string; // product
  dir: string; // products (también la ruta HTTP)
  xReq: string[];
  fields: Field[];
  ops: Op[];
  actions: Action[];
}

export interface Model {
  entities: Entity[];
}

/** Campo expuesto en las respuestas: pii y secret nunca salen. */
export const isPublic = (f: Field) => !f.pii && !f.secret;
