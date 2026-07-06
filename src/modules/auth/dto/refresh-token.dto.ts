import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const refreshTokenSchema = z
  .object({
    refreshToken: z
      .string()
      .min(1)
      .optional()
      .meta({
        description:
          'Deprecated: refresh token is read from the HttpOnly `refresh_token` cookie.',
      }),
  })
  .meta({ id: 'RefreshTokenDto' });

export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
