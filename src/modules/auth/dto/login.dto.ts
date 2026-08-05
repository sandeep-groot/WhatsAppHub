import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const loginSchema = z
  .object({
    email: z
      .string()
      .email()
      .meta({ example: 'admin@praxion.local', description: 'User email' }),
    password: z.string().min(8).meta({
      example: 'ChangeMe123!',
      description: 'Password (min 8 characters)',
    }),
    rememberMe: z.boolean().optional().default(false).meta({
      example: true,
      description: 'Extend session lifetime (30 days) when checked',
    }),
  })
  .meta({ id: 'LoginDto' });

export class LoginDto extends createZodDto(loginSchema) {}

export type LoginInput = z.infer<typeof loginSchema>;
