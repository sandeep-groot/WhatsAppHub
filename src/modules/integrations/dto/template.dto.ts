import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createTemplateSchema = z
  .object({
    wabaId: z.string().min(1).meta({ example: 'wabaid' }),
    name: z.string().min(1).meta({ example: 'template_name' }),
    language: z.string().min(1).meta({ example: 'en' }),
    category: z
      .string()
      .min(1)
      .meta({ example: 'AUTHENTICATION' }),
    components: z
      .array(z.record(z.string(), z.unknown()))
      .optional()
      .meta({
        example: [
          {
            type: 'BODY',
            text: 'Your verification code is {{1}}.',
          },
        ],
      }),
  })
  .meta({ id: 'CreateTemplateDto' });

export class CreateTemplateDto extends createZodDto(createTemplateSchema) {}

export const listTemplatesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).meta({ example: 1 }),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(10)
      .meta({ example: 10 }),
    includeTotal: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === 'true')
      .meta({ example: 'false' }),
    wabaId: z.string().optional().meta({ example: '' }),
    name: z.string().optional().meta({ example: '' }),
  })
  .meta({ id: 'ListTemplatesQuery' });

export class ListTemplatesQueryDto extends createZodDto(
  listTemplatesQuerySchema,
) {}

export const updateTemplateSchema = z
  .object({
    category: z
      .string()
      .optional()
      .meta({ example: 'MARKETING' }),
    components: z
      .array(z.record(z.string(), z.unknown()))
      .optional()
      .meta({
        example: [
          {
            type: 'BODY',
            text: 'Hello {{1}}, your code is {{2}}.',
          },
        ],
      }),
    messageSendTtlSeconds: z.coerce.number().int().optional(),
  })
  .meta({ id: 'UpdateTemplateDto' });

export class UpdateTemplateDto extends createZodDto(updateTemplateSchema) {}

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type ListTemplatesQueryInput = z.infer<typeof listTemplatesQuerySchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
