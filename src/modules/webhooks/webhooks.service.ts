import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import type { YCloudWebhookInput } from './dto/ycloud-webhook.dto';
import { BusinessAccountHandler } from './handlers/business-account.handler';
import { ContactHandler } from './handlers/contact.handler';
import { InboundMessageHandler } from './handlers/inbound-message.handler';
import { MessageUpdatedHandler } from './handlers/message-updated.handler';
import { PaymentHandler } from './handlers/payment.handler';
import { PhoneNumberUpdatedHandler } from './handlers/phone-number-updated.handler';
import { SmbHandler } from './handlers/smb.handler';
import { TemplateHandler } from './handlers/template.handler';
import { UserPreferencesHandler } from './handlers/user-preferences.handler';
import { verifyYcloudSignature } from './webhook-signature.util';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly realtime: RealtimeGateway,
    private readonly inboundMessageHandler: InboundMessageHandler,
    private readonly messageUpdatedHandler: MessageUpdatedHandler,
    private readonly phoneNumberUpdatedHandler: PhoneNumberUpdatedHandler,
    private readonly businessAccountHandler: BusinessAccountHandler,
    private readonly templateHandler: TemplateHandler,
    private readonly paymentHandler: PaymentHandler,
    private readonly contactHandler: ContactHandler,
    private readonly smbHandler: SmbHandler,
    private readonly userPreferencesHandler: UserPreferencesHandler,
  ) {}

  verifySignature(
    signatureHeader: string | undefined,
    rawBody?: Buffer,
  ): boolean {
    const ycloudConfig = this.configService.get('ycloud', { infer: true });
    const isProduction =
      this.configService.get('nodeEnv', { infer: true }) === 'production';
    return verifyYcloudSignature(
      signatureHeader,
      rawBody,
      ycloudConfig?.webhookSecret,
      isProduction,
    );
  }

  /**
   * Persists the raw event, routes it to the matching handler, then pushes it
   * to connected realtime clients. Always stores the event even if processing
   * fails so nothing is lost.
   */
  async processEvent(
    body: YCloudWebhookInput,
    signatureValid: boolean,
  ): Promise<{ success: boolean; eventDbId: string }> {
    const eventType = body.type;
    const eventId = body.id;

    // Dedup by YCloud event id when present.
    if (eventId) {
      const existing = await this.prisma.webhookEvent.findUnique({
        where: { eventId },
      });
      if (existing) {
        this.logger.log(`Duplicate webhook event ${eventId} ignored.`);
        return { success: true, eventDbId: existing.id };
      }
    }

    const event = await this.prisma.webhookEvent.create({
      data: {
        eventId,
        type: eventType,
        apiVersion: body.apiVersion,
        payload: body as unknown as object,
        signatureValid,
      },
    });

    try {
      await this.route(eventType, body);
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { processed: true, processedAt: new Date() },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to process event ${eventType}: ${message}`);
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { error: message },
      });
    }

    // Push to frontend regardless of internal handler outcome.
    this.realtime.emitWhatsappEvent(eventType, body);

    return { success: true, eventDbId: event.id };
  }

  // ─── Router ────────────────────────────────────────────────────────────────

  private async route(
    eventType: string,
    body: YCloudWebhookInput,
  ): Promise<void> {
    switch (eventType) {
      // ── Inbound messages ──────────────────────────────────────────────────
      case 'whatsapp.inbound_message.received':
        await this.inboundMessageHandler.handle(body);
        break;

      // ── Outbound message status updates ───────────────────────────────────
      case 'whatsapp.message.updated':
        await this.messageUpdatedHandler.handle(body);
        break;

      // ── Phone number lifecycle ────────────────────────────────────────────
      case 'whatsapp.phone_number.deleted':
      case 'whatsapp.phone_number.name_updated':
      case 'whatsapp.phone_number.business_username_updated':
      case 'whatsapp.phone_number.quality_updated':
        await this.phoneNumberUpdatedHandler.handle(body);
        break;

      // ── Business account lifecycle ────────────────────────────────────────
      case 'whatsapp.business_account.deleted':
      case 'whatsapp.business_account.updated':
        await this.businessAccountHandler.handle(body);
        break;

      // ── Template lifecycle ────────────────────────────────────────────────
      case 'whatsapp.template.category_updated':
      case 'whatsapp.template.quality_updated':
      case 'whatsapp.template.reviewed':
        await this.templateHandler.handle(body);
        break;

      // ── Payments ─────────────────────────────────────────────────────────
      case 'whatsapp.payment.updated':
        await this.paymentHandler.handle(body);
        break;

      // ── Contacts ─────────────────────────────────────────────────────────
      case 'contact.created':
      case 'contact.deleted':
      case 'contact.attributes_changed':
      case 'contact.unsubscribe.created':
      case 'contact.unsubscribe.deleted':
        await this.contactHandler.handle(body);
        break;

      // ── SMB (history, echoes, app state sync) ─────────────────────────────
      case 'whatsapp.smb.history':
      case 'whatsapp.smb.message.echoes':
      case 'whatsapp.smb.app.state.sync':
        await this.smbHandler.handle(body);
        break;

      // ── User preferences ─────────────────────────────────────────────────
      case 'whatsapp.user.preferences':
        await this.userPreferencesHandler.handle(body);
        break;

      default:
        this.logger.log(`No dedicated handler for event type: ${eventType}`);
        break;
    }
  }
}
