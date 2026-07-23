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
    clientDetailId: z
      .string()
      .optional()
      .nullable()
      .meta({ example: 'client_detail_id_here', description: 'Link to existing client details ID' }),
    newClientDetails: z
      .object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email address'),
        phoneNumber: z.string().min(1, 'Phone number is required'),
        companyName: z.string().optional().nullable(),
      })
      .optional()
      .nullable(),
  })
  .meta({ id: 'WabaBindDto' });

export class WabaBindDto extends createZodDto(wabaBindSchema) { }

export type WabaBindInput = z.infer<typeof wabaBindSchema>;
