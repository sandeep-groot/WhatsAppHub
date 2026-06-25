import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import type { YCloudWebhookInput } from './dto/ycloud-webhook.dto';
import { InboundMessageHandler } from './handlers/inbound-message.handler';
import { MessageUpdatedHandler } from './handlers/message-updated.handler';
import { PhoneNumberUpdatedHandler } from './handlers/phone-number-updated.handler';
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
  ) {}

  verifySignature(signatureHeader: string | undefined, rawBody?: Buffer): boolean {
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
   * Persists the raw event, routes it to the matching handler, then pushes it to
   * connected realtime clients. Always stores the event even if processing fails.
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

  private async route(
    eventType: string,
    body: YCloudWebhookInput,
  ): Promise<void> {
    switch (eventType) {
      case 'whatsapp.inbound_message.received':
        await this.inboundMessageHandler.handle(body);
        break;
      case 'whatsapp.message.updated':
        await this.inboundMessageHandler.handle(body);
        break;
      case 'whatsapp.phone_number.updated':
      case 'whatsapp.phone_number.name_updated':
      case 'whatsapp.phone_number.quality_updated':
        await this.phoneNumberUpdatedHandler.handle(body);
        break;
      default:
        this.logger.log(`No dedicated handler for event: ${eventType}`);
        break;
    }
  }
}
