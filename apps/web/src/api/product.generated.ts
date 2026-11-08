// Generado por `make gen`. No editar.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { request } from './request.generated';

export type Product = {
  id: string;
  sku: string;
  name: string;
  stock: number | null;
  price: string;
  categoryId: string;
  discontinuedAt: string | null;
  discontinueReason: string | null;
};

export type ProductCreate = {
  sku: string;
  name: string;
  stock?: number | null;
  price: string;
  categoryId: string;
  discontinuedAt?: string | null;
  discontinueReason?: string | null;
  supplierEmail?: string | null;
};

export type ProductUpdate = Partial<ProductCreate>;

export type ProductDiscontinueInput = {
  reason: string;
};

export const productApi = {
  list: () => request<Product[]>('GET', '/products'),
  read: (id: string) => request<Product>('GET', `/products/${id}`),
  create: (data: ProductCreate) => request<Product>('POST', '/products', data),
  update: (id: string, data: ProductUpdate) =>
    request<Product>('PATCH', `/products/${id}`, data),
  remove: (id: string) => request<void>('DELETE', `/products/${id}`),
  discontinue: (id: string, input: ProductDiscontinueInput) =>
    request<Product>('POST', `/products/${id}/discontinue`, input),
};

export const useProducts = () =>
  useQuery({ queryKey: ['products'], queryFn: productApi.list });

export const useProduct = (id: string) =>
  useQuery({
    queryKey: [...['products'], id],
    queryFn: () => productApi.read(id),
  });

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; data: ProductUpdate }) =>
      productApi.update(v.id, v.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDiscontinueProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; input: ProductDiscontinueInput }) =>
      productApi.discontinue(v.id, v.input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}
