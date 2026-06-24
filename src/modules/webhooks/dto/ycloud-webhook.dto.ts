import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const whatsappInboundMessageSchema = z
  .object({
    id: z.string().optional(),
    wamid: z.string().optional(),
    wabaId: z.string().optional(),
    from: z.string().optional(),
    fromUserId: z.string().optional(),
    to: z.string().optional(),
    sendTime: z.string().optional(),
    type: z.string().optional(),
    customerProfile: z
      .object({
        name: z.string().optional(),
      })
      .optional(),
    text: z
      .object({
        body: z.string().optional(),
      })
      .optional(),
  })
  .passthrough();

export const ycloudWebhookSchema = z
  .object({
    id: z.string().optional().meta({ example: 'evt_djeIQXaQPQyUcRFi' }),
    type: z.string().meta({ example: 'whatsapp.inbound_message.received' }),
    apiVersion: z.string().optional().meta({ example: 'v2' }),
    createTime: z.string().optional(),
    whatsappInboundMessage: whatsappInboundMessageSchema.optional(),
    whatsappMessage: z.record(z.string(), z.unknown()).optional(),
    whatsappPhoneNumber: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough()
  .meta({ id: 'YCloudWebhookDto' });

export class YCloudWebhookDto extends createZodDto(ycloudWebhookSchema) {}

export type YCloudWebhookInput = z.infer<typeof ycloudWebhookSchema>;
