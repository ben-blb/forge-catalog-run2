// IR (brain/spec/ir.yaml) -> código del proyecto. Determinista; se corre con `make gen`.
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { IrError, parseIr } from './parse.ts';
import { contractTest } from './writers/contract-test.ts';
import { controller, moduleFile, modulesFile } from './writers/controller.ts';
import { dto } from './writers/dto.ts';
import { fake } from './writers/fake.ts';
import { openapi } from './writers/openapi.ts';
import { prismaSchema } from './writers/prisma.ts';
import { repository } from './writers/repository.ts';
import { serviceBase, serviceOwned } from './writers/service.ts';
import { requestFile, web } from './writers/web.ts';

const root = resolve(import.meta.dirname, '../..');
const SKIP = new Set(['node_modules', 'dist', 'generated']); // generated = cliente Prisma

let model: ReturnType<typeof parseIr>;
try {
  model = parseIr(
    parseYaml(readFileSync(join(root, 'brain/spec/ir.yaml'), 'utf8')),
  );
} catch (err) {
  if (!(err instanceof IrError)) throw err;
  console.error(`brain/spec/ir.yaml: ${err.message}`);
  process.exit(1);
}

// 1. Qué se genera (ruta relativa -> contenido).
const generated = new Map<string, string>([
  ['apps/api/prisma/schema.generated.prisma', prismaSchema(model)],
  ['apps/api/openapi.generated.yaml', openapi(model)],
  ['apps/api/src/modules.generated.ts', modulesFile(model)],
  ['apps/web/src/api/request.generated.ts', requestFile],
]);
const owned = new Map<string, string>();
for (const e of model.entities) {
  const api = `apps/api/src/${e.dir}/${e.stem}`;
  generated.set(`${api}.dto.generated.ts`, dto(e, model));
  generated.set(`${api}.repository.generated.ts`, repository(e));
  generated.set(`${api}.repository.fake.generated.ts`, fake(e));
  generated.set(`${api}.service.generated.ts`, serviceBase(e, model));
  generated.set(`${api}.controller.generated.ts`, controller(e, model));
  generated.set(`${api}.module.generated.ts`, moduleFile(e));
  generated.set(`${api}.contract.generated.test.ts`, contractTest(e));
  generated.set(`apps/web/src/api/${e.stem}.generated.ts`, web(e, model));
  owned.set(`${api}.service.owned.ts`, serviceOwned(e, model));
}

// 2. Borra todo *.generated.* (así desaparece lo de entidades eliminadas).
function clean(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name)) clean(join(dir, entry.name));
    } else if (/\.generated\./.test(entry.name)) {
      rmSync(join(dir, entry.name));
    }
  }
}
clean(join(root, 'apps'));

// 3. Escribe lo generado; los *.owned sólo si no existen.
const written: string[] = [];
const write = (rel: string, content: string) => {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  written.push(rel);
};
for (const [rel, content] of generated) write(rel, content);
for (const [rel, content] of owned) {
  if (!existsSync(join(root, rel))) write(rel, content);
}

// 4. Formatea lo escrito (Biome) para que los diffs sean estables.
const ts = written.filter((f) => f.endsWith('.ts'));
if (ts.length) {
  execFileSync('pnpm', ['exec', 'biome', 'check', '--write', ...ts], {
    cwd: root,
    stdio: 'inherit',
  });
}
console.log(
  `gen: ${model.entities.length} entidades, ${generated.size} archivos generados, ${owned.size} stubs owned`,
);
