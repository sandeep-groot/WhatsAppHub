import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { YCloudWebhookInput } from '../dto/ycloud-webhook.dto';

interface YcloudMessage {
  id?: string;
  wamid?: string;
  wabaId?: string;
  from?: string;
  to?: string;
  type?: string;
  status?: string;
  sendTime?: string;
  createTime?: string;
  text?: { body?: string };
  customerProfile?: { name?: string };
}

@Injectable()
export class MessageUpdatedHandler {
  private readonly logger = new Logger(MessageUpdatedHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(body: YCloudWebhookInput): Promise<void> {
    const msg = body.whatsappMessage as YcloudMessage | undefined;
    if (!msg) return;

    const wamid = msg.wamid ?? msg.id;

    // 1. Persist/refresh the (outbound or status-updated) message.
    if (wamid) {
      const data = {
        wamid,
        wabaId: msg.wabaId,
        fromNumber: msg.from,
        toNumber: msg.to,
        customerName: msg.customerProfile?.name,
        messageType: msg.type,
        messageText: msg.text?.body,
        sendTime: msg.sendTime
          ? new Date(msg.sendTime)
          : msg.createTime
            ? new Date(msg.createTime)
            : undefined,
      };
      // Prisma ignores `undefined` fields on update, so later slim
      // status events won't wipe text/customerName set by the first event.
      await this.prisma.whatsappMessage.upsert({
        where: { wamid },
        create: data,
        update: data,
      });
      this.logger.log(`Stored/updated WhatsApp message ${wamid}.`);
    }

    // 2. Keep the legacy Message table status in sync (dashboard).
    if (msg.id && msg.status) {
      const existingMessage = await this.prisma.message.findUnique({
        where: { ycloudMessageId: msg.id },
      });
      if (existingMessage) {
        await this.prisma.message.update({
          where: { id: existingMessage.id },
          data: { status: msg.status },
        });
        this.logger.log(`Message ${msg.id} status updated to ${msg.status}.`);
      }
    }
  }
}