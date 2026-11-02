import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

/** Valida con Zod; un input inválido es 400. */
export function parse<T extends z.ZodType>(
  schema: T,
  value: unknown,
): z.output<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw new BadRequestException(result.error.issues);
  return result.data;
}

export const parseId = (id: string) => parse(z.uuid(), id);
