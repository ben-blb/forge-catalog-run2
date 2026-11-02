// Generado por `make gen`. No editar.

import { z } from 'zod';

export const CategoryCreate = z.object({
  name: z.string(),
});
export type CategoryCreate = z.output<typeof CategoryCreate>;
export const CategoryUpdate = CategoryCreate.partial();
export type CategoryUpdate = z.output<typeof CategoryUpdate>;
export const CategoryResponse = z.object({
  id: z.uuid(),
  name: z.string(),
});
export type CategoryResponse = z.output<typeof CategoryResponse>;
