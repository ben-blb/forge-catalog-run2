// Brain v1.3: cada SCR declara `route` y `component`; de ahí salen las rutas, la nav, el stub de la pantalla y un test por ruta.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { HEADER } from './shared.ts';

export interface Screen {
  id: string;
  title: string;
  route: string;
  component: string;
}

export class ScreenError extends Error {}

/** Lee el frontmatter de `brain/scr/*.md`, ordenado por id. Sin la carpeta, no hay pantallas. */
export function readScreens(dir: string): Screen[] {
  if (!existsSync(dir)) return [];
  const screens = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) =>
      parseScreen(`brain/scr/${f}`, readFileSync(join(dir, f), 'utf8')),
    );
  return screens.sort((a, b) => a.id.localeCompare(b.id));
}

function parseScreen(file: string, text: string): Screen {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1];
  const doc: Record<string, unknown> = (fm && parseYaml(fm)) || {};
  const get = (key: string) => {
    const v = doc[key];
    if (typeof v !== 'string' || v.trim() === '') {
      throw new ScreenError(
        `${file}: falta ${key}${key === 'component' ? ' (Brain v1.3)' : ''}`,
      );
    }
    return v;
  };
  return {
    id: get('id'),
    title: get('title'),
    route: get('route'),
    component: get('component'),
  };
}

const q = (s: string) => JSON.stringify(s);
/** Texto seguro dentro de JSX: lo que pudiera leerse como código va entre llaves. */
const jsxText = (s: string) => (/[{}<>&]/.test(s) ? `{${q(s)}}` : s);
const hasParam = (route: string) => route.includes(':');

export function routesFile(screens: Screen[]): string {
  const imports = screens.map(
    (s) => `import { ${s.component} } from './screens/${s.component}.owned';`,
  );
  const rows = screens.map(
    (s) =>
      `  { id: ${q(s.id)}, path: ${q(s.route)}, title: ${q(s.title)}, Component: ${s.component} },`,
  );
  // Sin un SCR en `/`, la raíz muestra el título de la app (y la nav hace de índice).
  const home = screens.some((s) => s.route === '/')
    ? ''
    : '\n        <Route path="/" element={<h1>App</h1>} />';
  return `${HEADER}import type { ComponentType } from 'react';
import { Link, Route, Routes } from 'react-router';
${imports.join('\n')}

export const screens: {
  id: string;
  path: string;
  title: string;
  Component: ComponentType;
}[] = [
${rows.join('\n')}
];

export function AppRoutes() {
  return (
    <Routes>${home}
      {screens.map(({ id, path, Component }) => (
        <Route
          key={id}
          path={path}
          element={
            <section data-screen={id}>
              <Component />
            </section>
          }
        />
      ))}
      <Route path="*" element={<p>No encontrado</p>} />
    </Routes>
  );
}

export function ScreenNav() {
  const links = screens.filter((s) => !s.path.includes(':'));
  if (links.length === 0) return null;
  return (
    <nav aria-label="Pantallas">
      <ul>
        {links.map(({ id, path, title }) => (
          <li key={id}>
            <Link to={path}>{title}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
`;
}

export function screenStub(s: Screen): string {
  return `export function ${s.component}() {
  return (
    <>
      <h1>${jsxText(s.title)}</h1>
      <p>Pendiente: ${s.id}</p>
    </>
  );
}
`;
}

export function routesTest(screens: Screen[]): string {
  const routeTests = screens.map(
    (s) => `
it(${q(`${s.id}.route`)}, () => {
  window.history.pushState({}, '', ${q(s.route.replace(/:[A-Za-z0-9]+/g, 'x'))});
  const { container } = render(<App />);
  expect(container.querySelector(${q(`[data-screen="${s.id}"]`)})).not.toBeNull();
});
`,
  );
  const hrefs = screens.filter((s) => !hasParam(s.route)).map((s) => s.route);
  return `${HEADER}import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from './App';

// Las pantallas llaman a la API: un fetch que nunca resuelve deja cada una en su estado de carga.
beforeEach(() => {
  vi.stubGlobal('fetch', () => new Promise(() => {}));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.pushState({}, '', '/');
});
${routeTests.join('')}
it('screens.nav', () => {
  render(<App />);
  expect(screen.queryAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(${JSON.stringify(hrefs)});
});
`;
}
