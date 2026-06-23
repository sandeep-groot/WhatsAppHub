import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const listPhoneNumbersQuerySchema = z
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
    wabaId: z
      .string()
      .optional()
      .meta({ example: '1483159693564497' }),
  })
  .meta({ id: 'ListPhoneNumbersQuery' });

export class ListPhoneNumbersQueryDto extends createZodDto(
  listPhoneNumbersQuerySchema,
) {}

export type ListPhoneNumbersQueryInput = z.infer<
  typeof listPhoneNumbersQuerySchema
>;
