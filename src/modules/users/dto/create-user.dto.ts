import { RoleName } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUserSchema = z
  .object({
    email: z.string().email().meta({ example: 'ops@praxion.local' }),
    password: z.string().min(8).meta({ example: 'SecurePass123!' }),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    roles: z
      .array(z.nativeEnum(RoleName))
      .min(1)
      .meta({ example: ['OPERATOR'] }),
  })
  .meta({ id: 'CreateUserDto' });

export class CreateUserDto extends createZodDto(createUserSchema) {}

export type CreateUserInput = z.infer<typeof createUserSchema>;
