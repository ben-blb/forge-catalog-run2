// Generado por `make gen`. No editar.
import type { ComponentType } from 'react';
import { Link, Route, Routes } from 'react-router';
import { ProductListScreen } from './screens/ProductListScreen.owned';

export const screens: {
  id: string;
  path: string;
  title: string;
  Component: ComponentType;
}[] = [
  {
    id: 'SCR-001',
    path: '/products',
    title: 'Lista de productos',
    Component: ProductListScreen,
  },
];

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<h1>App</h1>} />
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
