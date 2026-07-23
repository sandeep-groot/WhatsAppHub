import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createClientDetailSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phoneNumber: z.string().min(1, 'Phone number is required'),
    companyName: z.string().optional().nullable(),
  })
  .meta({ id: 'CreateClientDetailDto' });

export class CreateClientDetailDto extends createZodDto(createClientDetailSchema) {}

export type CreateClientDetailInput = z.infer<typeof createClientDetailSchema>;
