import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const wabaBindSchema = z
  .object({
    code: z
      .string()
      .min(1)
      .meta({ example: 'oauth_code_here', description: 'Meta OAuth authorization code' }),
    wabaId: z
      .string()
      .min(1)
      .meta({ example: 'waba_id_here', description: 'WhatsApp Business Account ID' }),
    phoneNumberId: z
      .string()
      .min(1)
      .meta({ example: 'phone_number_id_here', description: 'WhatsApp Business Phone Number ID' }),
    solutionId: z
      .string()
      .min(1)
      .meta({ example: 'solution_id_here', description: 'YCloud Solution/Partner ID' }),
  })
  .meta({ id: 'WabaBindDto' });

export class WabaBindDto extends createZodDto(wabaBindSchema) {}

export type WabaBindInput = z.infer<typeof wabaBindSchema>;
