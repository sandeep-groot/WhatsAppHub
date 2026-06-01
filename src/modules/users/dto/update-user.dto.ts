import { RoleName } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateUserSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    roles: z.array(z.nativeEnum(RoleName)).min(1).optional(),
  })
  .meta({ id: 'UpdateUserDto' });

export class UpdateUserDto extends createZodDto(updateUserSchema) {}

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
