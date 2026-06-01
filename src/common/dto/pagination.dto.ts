import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).meta({ example: 1 }),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(25)
      .meta({ example: 25 }),
  })
  .meta({ id: 'PaginationQuery' });

export class PaginationQueryDto extends createZodDto(paginationQuerySchema) {}

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;

export function paginationMeta(page: number, limit: number, total: number) {
  return { page, limit, total };
}

export function paginationSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
