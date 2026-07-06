import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const roleNameSchema = z.enum(['ADMIN', 'OPERATOR', 'VIEWER']);

const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  roles: z.array(roleNameSchema),
});

/** Login / refresh response — tokens are set as HttpOnly cookies, not in the body. */
export const authSessionResponseSchema = z
  .object({
    user: authUserSchema,
  })
  .meta({ id: 'AuthSessionResponse' });

export class AuthSessionResponseDto extends createZodDto(
  authSessionResponseSchema,
) {}

export const authUserResponseSchema = authUserSchema.meta({
  id: 'AuthUserResponse',
});

export class AuthUserResponseDto extends createZodDto(authUserResponseSchema) {}
