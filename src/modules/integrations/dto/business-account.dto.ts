import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const listBusinessAccountsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).meta({ example: 1 }),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(10)
      .meta({ example: 10 }),
    includeTotal: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === 'true')
      .meta({ example: 'false' }),
  })
  .meta({ id: 'ListBusinessAccountsQuery' });

export class ListBusinessAccountsQueryDto extends createZodDto(
  listBusinessAccountsQuerySchema,
) {}

export type ListBusinessAccountsQueryInput = z.infer<
  typeof listBusinessAccountsQuerySchema
>;
