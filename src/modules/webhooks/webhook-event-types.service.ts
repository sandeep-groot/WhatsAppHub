import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateWebhookEventTypeDto,
  UpdateWebhookEventTypeDto,
  WebhookEventTypeItemDto,
} from './dto/webhook-event-types-response.dto';
import { WEBHOOK_EVENT_CATALOGUE } from './webhook-events.constants';

export interface WebhookEventTypeGroup {
  category: string;
  events: WebhookEventTypeItemDto[];
}

/** Raw row returned by $queryRaw — matches the webhook_event_types table columns. */
interface RawEventTypeRow {
  id: string;
  type: string;
  label: string;
  category: string;
  description: string;
  isActive: boolean;
}

@Injectable()
export class WebhookEventTypesService implements OnModuleInit {
  private readonly logger = new Logger(WebhookEventTypesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Startup seed ─────────────────────────────────────────────────────────

  /**
   * Upserts every entry from the static catalogue on startup via raw SQL so
   * this works even before `prisma generate` has been re-run after adding the
   * WebhookEventType model.
   *
   * Once you run `npx prisma generate` the $queryRaw calls can be replaced
   * with the typed prisma.webhookEventType client.
   *
   * isActive is intentionally NOT overwritten on existing rows so admin
   * changes survive restarts.
   */
  async onModuleInit(): Promise<void> {
    try {
      for (const entry of WEBHOOK_EVENT_CATALOGUE) {
        await this.prisma.$executeRaw`
          INSERT INTO webhook_event_types (id, type, label, category, description, "isActive", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${entry.type}, ${entry.label}, ${entry.category}, ${entry.description}, true, NOW(), NOW())
          ON CONFLICT (type) DO UPDATE
            SET label       = EXCLUDED.label,
                category    = EXCLUDED.category,
                description = EXCLUDED.description,
                "updatedAt" = NOW()
        `;
      }
      this.logger.log(
        `Webhook event type catalogue synced (${WEBHOOK_EVENT_CATALOGUE.length} entries).`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Webhook event type catalogue sync failed — DB may be unavailable: ${message}`,
      );
    }
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  /** Flat list of active event types — for a simple dropdown. */
  async findAll(): Promise<WebhookEventTypeItemDto[]> {
    const rows = await this.prisma.$queryRaw<RawEventTypeRow[]>`
      SELECT id, type, label, category, description, "isActive"
      FROM   webhook_event_types
      WHERE  "isActive" = true
      ORDER  BY category ASC, label ASC
    `;
    return rows;
  }

  /** All rows including inactive — for the admin management screen. */
  async findAllAdmin(): Promise<WebhookEventTypeItemDto[]> {
    const rows = await this.prisma.$queryRaw<RawEventTypeRow[]>`
      SELECT id, type, label, category, description, "isActive"
      FROM   webhook_event_types
      ORDER  BY category ASC, label ASC
    `;
    return rows;
  }

  /** Grouped by category — for an optgroup / categorised checklist UI. */
  async findGrouped(): Promise<WebhookEventTypeGroup[]> {
    const flat = await this.findAll();

    const map = new Map<string, WebhookEventTypeItemDto[]>();
    for (const item of flat) {
      const group = map.get(item.category) ?? [];
      group.push(item);
      map.set(item.category, group);
    }

    return Array.from(map.entries()).map(([category, events]) => ({
      category,
      events,
    }));
  }

  /** Single event type by id — throws 404 if not found. */
  async findOne(id: string): Promise<WebhookEventTypeItemDto> {
    const rows = await this.prisma.$queryRaw<RawEventTypeRow[]>`
      SELECT id, type, label, category, description, "isActive"
      FROM   webhook_event_types
      WHERE  id = ${id}
      LIMIT  1
    `;
    const record = rows[0];
    if (!record) {
      throw new NotFoundException(`Webhook event type "${id}" not found.`);
    }
    return record;
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateWebhookEventTypeDto): Promise<WebhookEventTypeItemDto> {
    // Check for duplicate type.
    const existing = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM webhook_event_types WHERE type = ${dto.type} LIMIT 1
    `;
    if (existing.length > 0) {
      throw new ConflictException(
        `A webhook event type with type "${dto.type}" already exists.`,
      );
    }

    const rows = await this.prisma.$queryRaw<RawEventTypeRow[]>`
      INSERT INTO webhook_event_types (id, type, label, category, description, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${dto.type}, ${dto.label}, ${dto.category}, ${dto.description}, ${dto.isActive ?? true}, NOW(), NOW())
      RETURNING id, type, label, category, description, "isActive"
    `;
    return rows[0];
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateWebhookEventTypeDto,
  ): Promise<WebhookEventTypeItemDto> {
    // Ensure the record exists.
    await this.findOne(id);

    // Guard against duplicate type if renaming.
    if (dto.type !== undefined) {
      const conflict = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM webhook_event_types WHERE type = ${dto.type} AND id <> ${id} LIMIT 1
      `;
      if (conflict.length > 0) {
        throw new ConflictException(
          `Another event type with type "${dto.type}" already exists.`,
        );
      }
    }

    // Build SET clause dynamically from provided fields only.
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (dto.type !== undefined) {
      setClauses.push(`type = $${paramIndex++}`);
      values.push(dto.type);
    }
    if (dto.label !== undefined) {
      setClauses.push(`label = $${paramIndex++}`);
      values.push(dto.label);
    }
    if (dto.category !== undefined) {
      setClauses.push(`category = $${paramIndex++}`);
      values.push(dto.category);
    }
    if (dto.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(dto.description);
    }
    if (dto.isActive !== undefined) {
      setClauses.push(`"isActive" = $${paramIndex++}`);
      values.push(dto.isActive);
    }

    if (setClauses.length === 0) {
      // Nothing to change — just return the current record.
      return this.findOne(id);
    }

    setClauses.push(`"updatedAt" = NOW()`);
    values.push(id); // for the WHERE clause

    const query = `
      UPDATE webhook_event_types
      SET    ${setClauses.join(', ')}
      WHERE  id = $${paramIndex}
      RETURNING id, type, label, category, description, "isActive"
    `;

    const rows = await this.prisma.$queryRawUnsafe<RawEventTypeRow[]>(
      query,
      ...values,
    );
    return rows[0];
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  /** Hard-deletes the record. Prefer PATCH isActive=false for built-in types. */
  async remove(id: string): Promise<{ deleted: true; id: string }> {
    await this.findOne(id); // throws 404 if not found

    await this.prisma.$executeRaw`
      DELETE FROM webhook_event_types WHERE id = ${id}
    `;
    this.logger.log(`Webhook event type "${id}" deleted.`);
    return { deleted: true, id };
  }
}
