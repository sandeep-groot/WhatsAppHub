import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateClientDetailSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().min(1).optional(),
    companyName: z.string().optional().nullable(),
  })
  .meta({ id: 'UpdateClientDetailDto' });

export class UpdateClientDetailDto extends createZodDto(updateClientDetailSchema) {}

export type UpdateClientDetailInput = z.infer<typeof updateClientDetailSchema>;
