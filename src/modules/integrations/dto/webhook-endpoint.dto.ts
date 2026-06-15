import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const webhookStatusSchema = z.enum(['active', 'disabled', 'pending']);

const eventPropertySchema = z.object({
  event: z.string().min(1),
  properties: z.array(z.string()),
});

export const createWebhookEndpointSchema = z
  .object({
    url: z.string().url().meta({
      example: 'https://eoljfwp6iz856ug.m.pipedream.net',
    }),
    enabledEvents: z
      .array(z.string().min(1))
      .min(1)
      .meta({
        example: [
          'whatsapp.message.updated',
          'whatsapp.inbound_message.received',
        ],
      }),
    eventProperties: z
      .array(eventPropertySchema)
      .optional()
      .meta({
        example: [
          {
            event: 'whatsapp.message.updated',
            properties: [
              'whatsappMessage',
              'conversation',
              'regionCode',
              'createTime',
              'sendTime',
              'deliverTime',
            ],
          },
        ],
      }),
    description: z.string().optional().meta({
      example: 'Webhook to receive WhatsApp message updates',
    }),
    status: webhookStatusSchema.optional().default('active'),
  })
  .meta({ id: 'CreateWebhookEndpointDto' });

export class CreateWebhookEndpointDto extends createZodDto(
  createWebhookEndpointSchema,
) {}

export const updateWebhookEndpointSchema = z
  .object({
    url: z.string().url().optional(),
    enabledEvents: z.array(z.string().min(1)).min(1).optional(),
    eventProperties: z.array(eventPropertySchema).optional(),
    description: z.string().optional(),
    status: webhookStatusSchema.optional(),
  })
  .meta({ id: 'UpdateWebhookEndpointDto' });

export class UpdateWebhookEndpointDto extends createZodDto(
  updateWebhookEndpointSchema,
) {}

export const listWebhookEndpointsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    includeTotal: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === 'true'),
  })
  .meta({ id: 'ListWebhookEndpointsQuery' });

export class ListWebhookEndpointsQueryDto extends createZodDto(
  listWebhookEndpointsQuerySchema,
) {}

export type CreateWebhookEndpointInput = z.infer<
  typeof createWebhookEndpointSchema
>;
export type UpdateWebhookEndpointInput = z.infer<
  typeof updateWebhookEndpointSchema
>;
export type ListWebhookEndpointsQueryInput = z.infer<
  typeof listWebhookEndpointsQuerySchema
>;