// Generado por `make gen`. No editar.

import { z } from 'zod';

export const ProductCreate = z.object({
  sku: z.string(),
  name: z.string(),
  price: z.string().regex(/^-?\d+(\.\d+)?$/),
  categoryId: z.uuid(),
  discontinuedAt: z.iso.datetime().pipe(z.coerce.date()).nullish(),
  discontinueReason: z.string().nullish(),
  supplierEmail: z.string().nullish(),
});
export type ProductCreate = z.output<typeof ProductCreate>;
export const ProductUpdate = ProductCreate.partial();
export type ProductUpdate = z.output<typeof ProductUpdate>;
export const ProductDiscontinueInput = z.object({
  reason: z.string(),
});
export type ProductDiscontinueInput = z.output<typeof ProductDiscontinueInput>;
export const ProductResponse = z.object({
  id: z.uuid(),
  sku: z.string(),
  name: z.string(),
  price: z.coerce.string(),
  categoryId: z.uuid(),
  discontinuedAt: z
    .date()
    .transform((d) => d.toISOString())
    .nullable(),
  discontinueReason: z.string().nullable(),
});
export type ProductResponse = z.output<typeof ProductResponse>;
