import { pascal, plural } from '../names.ts';
import { type Entity, type Field, isPublic, type Model } from '../types.ts';
import { createFields, entityOf, HEADER, tsType } from './shared.ts';

export const requestFile = `${HEADER}
const BASE = '/api';

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(\`\${BASE}\${path}\`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(\`\${method} \${path} -> \${res.status}\`);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
`;

const prop = (f: Field, input: boolean) => {
  const t = tsType(f.type);
  if (!f.optional) return `  ${f.name}: ${t};`;
  return input ? `  ${f.name}?: ${t} | null;` : `  ${f.name}: ${t} | null;`;
};

export function web(e: Entity, model: Model): string {
  const N = e.name;
  const camelN = N.charAt(0).toLowerCase() + N.slice(1);
  const P = pascal(plural(N));
  const has = (op: string) => e.ops.includes(op as never);
  const key = `['${e.dir}']`;

  const types = [
    `export type ${N} = {\n${e.fields
      .filter(isPublic)
      .map((f) => prop(f, false))
      .join('\n')}\n};`,
    `export type ${N}Create = {\n${createFields(e)
      .map((f) => prop(f, true))
      .join('\n')}\n};`,
    `export type ${N}Update = Partial<${N}Create>;`,
    ...e.actions.map(
      (a) =>
        `export type ${N}${pascal(a.name)}Input = {\n${a.input.map((f) => prop(f, true)).join('\n')}\n};`,
    ),
  ];
  const outImports = [
    ...new Set(e.actions.map((a) => a.out).filter((o) => o !== N)),
  ].map(
    (o) =>
      `import type { ${o} } from './${entityOf(model.entities, o).stem}.generated';`,
  );

  const api: string[] = [];
  const hooks: string[] = [];
  const invalidate = `onSuccess: () => qc.invalidateQueries({ queryKey: ${key} })`;
  if (has('list')) {
    api.push(`  list: () => request<${N}[]>('GET', '/${e.dir}'),`);
    hooks.push(
      `export const use${P} = () => useQuery({ queryKey: ${key}, queryFn: ${camelN}Api.list });`,
    );
  }
  if (has('read')) {
    api.push(
      `  read: (id: string) => request<${N}>('GET', \`/${e.dir}/\${id}\`),`,
    );
    hooks.push(`export const use${N} = (id: string) =>
  useQuery({ queryKey: [...${key}, id], queryFn: () => ${camelN}Api.read(id) });`);
  }
  if (has('create')) {
    api.push(
      `  create: (data: ${N}Create) => request<${N}>('POST', '/${e.dir}', data),`,
    );
    hooks.push(`export function useCreate${N}() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ${camelN}Api.create, ${invalidate} });
}`);
  }
  if (has('update')) {
    api.push(
      `  update: (id: string, data: ${N}Update) => request<${N}>('PATCH', \`/${e.dir}/\${id}\`, data),`,
    );
    hooks.push(`export function useUpdate${N}() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; data: ${N}Update }) => ${camelN}Api.update(v.id, v.data),
    ${invalidate},
  });
}`);
  }
  if (has('delete')) {
    api.push(
      `  remove: (id: string) => request<void>('DELETE', \`/${e.dir}/\${id}\`),`,
    );
    hooks.push(`export function useDelete${N}() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ${camelN}Api.remove, ${invalidate} });
}`);
  }
  for (const a of e.actions) {
    const In = `${N}${pascal(a.name)}Input`;
    api.push(
      `  ${a.name}: (id: string, input: ${In}) => request<${a.out}>('POST', \`/${e.dir}/\${id}/${a.name}\`, input),`,
    );
    hooks.push(`export function use${pascal(a.name)}${N}() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; input: ${In} }) => ${camelN}Api.${a.name}(v.id, v.input),
    ${invalidate},
  });
}`);
  }

  const rq = [
    ...(hooks.some((h) => h.includes('useMutation')) ? ['useMutation'] : []),
    ...(hooks.some((h) => h.includes('useQuery(')) ? ['useQuery'] : []),
    ...(hooks.some((h) => h.includes('useQueryClient'))
      ? ['useQueryClient']
      : []),
  ];
  return `${HEADER}
${rq.length ? `import { ${rq.join(', ')} } from '@tanstack/react-query';\n` : ''}${outImports.join('\n')}
import { request } from './request.generated';

${types.join('\n\n')}

export const ${camelN}Api = {
${api.join('\n')}
};

${hooks.join('\n\n')}
`;
}
