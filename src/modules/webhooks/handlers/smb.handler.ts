import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { YCloudWebhookInput } from '../dto/ycloud-webhook.dto';

/**
 * Handles:
 *   whatsapp.smb.history         (inbound variant — whatsappInboundMessage)
 *   whatsapp.smb.history         (outbound variant — whatsappMessage)
 *   whatsapp.smb.message.echoes  (whatsappMessage)
 *   whatsapp.smb.app.state.sync  (whatsappSmbAppStateSync)
 *
 * SMB history events are replayed messages from the SMB WhatsApp app.
 * We store inbound ones in whatsapp_messages just like live inbound events,
 * and outbound/echo ones via the same upsert path as message.updated.
 */
@Injectable()
export class SmbHandler {
  private readonly logger = new Logger(SmbHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(body: YCloudWebhookInput): Promise<void> {
    switch (body.type) {
      case 'whatsapp.smb.history':
        await this.handleHistory(body);
        break;
      case 'whatsapp.smb.message.echoes':
        await this.handleEchoes(body);
        break;
      case 'whatsapp.smb.app.state.sync':
        this.handleAppStateSync(body);
        break;
      default:
        this.logger.log(`Unhandled SMB event: ${body.type}`);
    }
  }

  // ─── history ───────────────────────────────────────────────────────────────

  private async handleHistory(body: YCloudWebhookInput): Promise<void> {
    if (body.whatsappInboundMessage) {
      await this.persistInbound(body.whatsappInboundMessage, 'smb.history');
    } else if (body.whatsappMessage) {
      await this.persistOutbound(body.whatsappMessage, 'smb.history');
    } else {
      this.logger.warn(
        'whatsapp.smb.history: neither whatsappInboundMessage nor whatsappMessage present.',
      );
    }
  }

  // ─── echoes ────────────────────────────────────────────────────────────────

  private async handleEchoes(body: YCloudWebhookInput): Promise<void> {
    if (!body.whatsappMessage) {
      this.logger.warn(
        'whatsapp.smb.message.echoes: missing whatsappMessage payload.',
      );
      return;
    }
    await this.persistOutbound(body.whatsappMessage, 'smb.echoes');
  }

  // ─── app state sync ────────────────────────────────────────────────────────

  private handleAppStateSync(body: YCloudWebhookInput): void {
    const sync = body.whatsappSmbAppStateSync;
    if (!sync) {
      this.logger.warn(
        'whatsapp.smb.app.state.sync: missing whatsappSmbAppStateSync payload.',
      );
      return;
    }
    const entries = sync.stateSync ?? [];
    this.logger.log(
      `SMB app state sync for ${sync.phoneNumber} (wabaId: ${sync.wabaId}): ` +
        `${entries.length} contact(s) synced.`,
    );
    for (const entry of entries) {
      this.logger.log(
        `  ${entry.action?.toUpperCase()} ${entry.contact?.phoneNumber ?? 'unknown'} ` +
          `(${entry.contact?.fullName ?? 'n/a'}) ts=${entry.timestamp}.`,
      );
    }
  }

  // ─── helpers ───────────────────────────────────────────────────────────────

  private async persistInbound(
    inbound: NonNullable<YCloudWebhookInput['whatsappInboundMessage']>,
    source: string,
  ): Promise<void> {
    const wamid = inbound.wamid ?? inbound.id;
    if (!wamid) {
      this.logger.warn(`[${source}] Inbound message has no wamid/id — skipping.`);
      return;
    }

    const existing = await this.prisma.whatsappMessage.findUnique({
      where: { wamid },
    });
    if (existing) {
      this.logger.log(`[${source}] Message ${wamid} already stored. Skipping.`);
      return;
    }

    await this.prisma.whatsappMessage.create({
      data: {
        wamid,
        wabaId: inbound.wabaId,
        fromNumber: inbound.from,
        toNumber: inbound.to,
        customerName: inbound.customerProfile?.name,
        messageType: inbound.type,
        messageText: inbound.text?.body,
        sendTime: inbound.sendTime ? new Date(inbound.sendTime) : undefined,
      },
    });
    this.logger.log(`[${source}] Stored inbound message ${wamid}.`);
  }

  private async persistOutbound(
    msg: NonNullable<YCloudWebhookInput['whatsappMessage']>,
    source: string,
  ): Promise<void> {
    const wamid = msg.wamid ?? msg.id;
    if (!wamid) {
      this.logger.warn(`[${source}] Outbound message has no wamid/id — skipping.`);
      return;
    }

    const data = {
      wamid,
      wabaId: msg.wabaId,
      fromNumber: msg.from,
      toNumber: msg.to,
      customerName: msg.customerProfile?.name,
      messageType: msg.type,
      messageText: msg.text?.body,/*  */
      sendTime: msg.sendTime
        ? new Date(msg.sendTime)
        : msg.createTime
          ? new Date(msg.createTime)
          : undefined,
    };

    await this.prisma.whatsappMessage.upsert({
      where: { wamid },
      create: data,
      update: data,
    });
    this.logger.log(`[${source}] Stored/updated outbound message ${wamid}.`);
  }
}
