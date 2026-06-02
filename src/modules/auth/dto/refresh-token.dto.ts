import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const refreshTokenSchema = z
  .object({
    refreshToken: z
      .string()
      .min(1)
      .meta({ description: 'Opaque refresh token from login response' }),
  })
  .meta({ id: 'RefreshTokenDto' });

export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
