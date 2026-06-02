import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const roleNameSchema = z.enum(['ADMIN', 'OPERATOR', 'VIEWER']);

export const authTokensResponseSchema = z
  .object({
    accessToken: z.string().meta({ description: 'JWT access token' }),
    refreshToken: z.string().meta({ description: 'Opaque refresh token' }),
    user: z.object({
      id: z.string(),
      email: z.string().email(),
      firstName: z.string().nullable(),
      lastName: z.string().nullable(),
      roles: z.array(roleNameSchema),
    }),
  })
  .meta({ id: 'AuthTokensResponse' });

export class AuthTokensResponseDto extends createZodDto(
  authTokensResponseSchema,
) {}

export const authUserResponseSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    roles: z.array(roleNameSchema),
  })
  .meta({ id: 'AuthUserResponse' });

export class AuthUserResponseDto extends createZodDto(authUserResponseSchema) {}
