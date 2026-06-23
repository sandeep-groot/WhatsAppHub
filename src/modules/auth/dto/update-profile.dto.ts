import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
  })
  .meta({ id: 'UpdateProfileDto' });

export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
