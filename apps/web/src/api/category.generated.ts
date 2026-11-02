// Generado por `make gen`. No editar.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { request } from './request.generated';

export type Category = {
  id: string;
  name: string;
};

export type CategoryCreate = {
  name: string;
};

export type CategoryUpdate = Partial<CategoryCreate>;

export const categoryApi = {
  list: () => request<Category[]>('GET', '/categories'),
  read: (id: string) => request<Category>('GET', `/categories/${id}`),
  create: (data: CategoryCreate) =>
    request<Category>('POST', '/categories', data),
};

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: categoryApi.list });

export const useCategory = (id: string) =>
  useQuery({
    queryKey: [...['categories'], id],
    queryFn: () => categoryApi.read(id),
  });

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}
