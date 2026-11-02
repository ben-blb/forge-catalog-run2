import { useCategories } from '../api/category.generated';
import { useProducts } from '../api/product.generated';

export function ProductListScreen() {
  const products = useProducts();
  const categories = useCategories();

  if (products.isPending) {
    return <p role="status">Cargando…</p>;
  }

  if (products.isError) {
    return (
      <div role="alert">
        <p>No se pudieron cargar los productos.</p>
        <button type="button" onClick={() => products.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  if (products.data.length === 0) {
    return <p>Aún no hay productos</p>;
  }

  const categoryNames = new Map(
    (categories.data ?? []).map((c) => [c.id, c.name]),
  );

  return (
    <table>
      <thead>
        <tr>
          <th>SKU</th>
          <th>Nombre</th>
          <th>Precio</th>
          <th>Categoría</th>
        </tr>
      </thead>
      <tbody>
        {products.data.map((p) => (
          <tr key={p.id}>
            <td>{p.sku}</td>
            <td>{p.name}</td>
            <td>{p.price}</td>
            <td>{categoryNames.get(p.categoryId) ?? ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
