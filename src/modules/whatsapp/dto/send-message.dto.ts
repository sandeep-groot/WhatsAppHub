import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ─── Shared fields ────────────────────────────────────────────────────────────

const fromField = z
  .string()
  .min(1)
  .meta({
    example: '+17174300078',
    description: 'Sender WhatsApp business number in E.164 format.',
  });

const toField = z
  .string()
  .min(1)
  .meta({
    example: '+919779528344',
    description: 'Recipient phone number in E.164 format.',
  });

// ─── Text payload ─────────────────────────────────────────────────────────────

const textSchema = z.object({
  body: z
    .string()
    .min(1)
    .meta({
      example: 'This is a testing message from the Cloud API.',
      description: 'Text message body to deliver.',
    }),
});

// ─── Template payload ─────────────────────────────────────────────────────────

const templateParameterSchema = z.object({
  type: z.string().meta({ example: 'text' }),
  text: z.string().optional().meta({ example: 'Abhishek' }),
});

const templateComponentSchema = z.object({
  type: z.string().meta({ example: 'body' }),
  sub_type: z.string().optional(),
  index: z.union([z.string(), z.number()]).optional(),
  parameters: z.array(templateParameterSchema).optional(),
});

const templateSchema = z.object({
  name: z
    .string()
    .min(1)
    .meta({ example: 'template_authenticati', description: 'Template name.' }),
  language: z.object({
    code: z.string().min(1).meta({ example: 'en' }),
    policy: z.string().optional().meta({ example: 'deterministic' }),
  }),
  components: z.array(templateComponentSchema).optional(),
});

// ─── Message schema ───────────────────────────────────────────────────────────
//
// `type` decides which payload is required:
//   - type === 'text'     → `text` required,     `template` must be omitted
//   - type === 'template' → `template` required, `text` must be omitted

export const sendMessageSchema = z
  .object({
    type: z.enum(['text', 'template']).meta({ example: 'text' }),
    from: fromField,
    to: toField,
    text: textSchema.optional(),
    template: templateSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === 'text') {
      if (!val.text) {
        ctx.addIssue({
          code: 'custom',
          path: ['text'],
          message: 'text is required when type is "text".',
        });
      }
      if (val.template) {
        ctx.addIssue({
          code: 'custom',
          path: ['template'],
          message: 'template must be omitted when type is "text".',
        });
      }
    } else {
      if (!val.template) {
        ctx.addIssue({
          code: 'custom',
          path: ['template'],
          message: 'template is required when type is "template".',
        });
      }
      if (val.text) {
        ctx.addIssue({
          code: 'custom',
          path: ['text'],
          message: 'text must be omitted when type is "template".',
        });
      }
    }
  })
  .meta({ id: 'SendMessageDto' });

export class SendMessageDto extends createZodDto(sendMessageSchema) {}

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
