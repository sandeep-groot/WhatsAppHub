import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { YCloudWebhookInput } from '../dto/ycloud-webhook.dto';
import { customerName } from '../../whatsapp/utils/whatsapp-helper';

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

    // 1. Resolve registered business line connection
    let whatsAppNumber = await this.prisma.whatsAppNumber.findFirst({
      where: {
        OR: [
          { phoneNumber: msg.from },
          { phoneNumber: msg.to },
        ],
      },
    });

    if (!whatsAppNumber) {
      this.logger.warn(`Could not resolve registered business line connection for message status update: ${wamid}`);
      return;
    }

    const isOutbound = msg.from === whatsAppNumber.phoneNumber;
    const customerNumber = isOutbound ? (msg.to ?? 'unknown') : (msg.from ?? 'unknown');
    const direction = isOutbound ? ('OUTBOUND' as const) : ('INBOUND' as const);

    // 2. Persist/refresh the message state in unified table.
    if (wamid) {
      let resolvedCustomerName = msg.customerProfile?.name;
      if (!resolvedCustomerName && customerNumber !== 'unknown') {
        resolvedCustomerName = (await customerName(this.prisma, customerNumber)) ?? undefined;
      }

      const commonData = {
        wamid,
        wabaId: msg.wabaId,
        fromNumber: msg.from,
        toNumber: msg.to,
        customerNumber,
        customerName: resolvedCustomerName,
        direction,
        messageType: msg.type,
        messageText: msg.text?.body,
        status: msg.status ?? 'SENT',
        sendTime: msg.sendTime
          ? new Date(msg.sendTime)
          : msg.createTime
            ? new Date(msg.createTime)
            : undefined,
      };

      await this.prisma.whatsappMessage.upsert({
        where: { wamid },
        create: {
          ...commonData,
          whatsAppNumber: { connect: { id: whatsAppNumber.id } },
        },
        update: {
          status: commonData.status,
          sendTime: commonData.sendTime,
        },
      });
      this.logger.log(`Stored/updated WhatsApp message ${wamid} with status ${msg.status}.`);
    }
  }
}