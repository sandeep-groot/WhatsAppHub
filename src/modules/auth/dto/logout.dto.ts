import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const logoutSchema = z
  .object({
    refreshToken: z
      .string()
      .min(1)
      .optional()
      .meta({
        description:
          'Optional: revoke only this refresh token. If omitted, revokes all sessions and uses the `refresh_token` cookie when present.',
      }),
  })
  .meta({ id: 'LogoutDto' });

export class LogoutDto extends createZodDto(logoutSchema) {}

export type LogoutInput = z.infer<typeof logoutSchema>;
