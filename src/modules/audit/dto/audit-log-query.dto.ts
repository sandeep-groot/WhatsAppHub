import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const auditLogQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    actorId: z.string().optional(),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    action: z.string().optional(),
  })
  .meta({ id: 'AuditLogQuery' });

export class AuditLogQueryDto extends createZodDto(auditLogQuerySchema) {}

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
