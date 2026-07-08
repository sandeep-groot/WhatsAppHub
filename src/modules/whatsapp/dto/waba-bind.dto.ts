import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const wabaBindSchema = z
  .object({
    wabaId: z
      .string()
      .min(1)
      .meta({ example: 'waba_id_here', description: 'WhatsApp Business Account ID' }),
    phoneNumberId: z
      .string()
      .min(1)
      .meta({ example: 'phone_number_id_here', description: 'WhatsApp Business Phone Number ID' }),
  })
  .meta({ id: 'WabaBindDto' });

export class WabaBindDto extends createZodDto(wabaBindSchema) { }

export type WabaBindInput = z.infer<typeof wabaBindSchema>;
