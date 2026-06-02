import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  paginationMeta,
  paginationSkip,
} from '../../common/dto/pagination.dto';
import { PrismaService } from '../../database/prisma.service';
import type { AuditLogQueryInput } from './dto/audit-log-query.dto';

export type AuditRecordInput = {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  record(input: AuditRecordInput): void {
    void this.prisma.auditLog
      .create({
        data: {
          actorId: input.actorId ?? null,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId ?? null,
          metadata: input.metadata ?? Prisma.JsonNull,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        },
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to write audit log: ${message}`);
      });
  }

  async findMany(query: AuditLogQueryInput) {
    const where = {
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.action ? { action: query.action } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: paginationSkip(query.page, query.limit),
        take: query.limit,
        include: {
          actor: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      meta: paginationMeta(query.page, query.limit, total),
    };
  }
}
