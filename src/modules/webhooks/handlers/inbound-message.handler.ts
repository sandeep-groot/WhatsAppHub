import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { YCloudWebhookInput } from '../dto/ycloud-webhook.dto';

@Injectable()
export class InboundMessageHandler {
  private readonly logger = new Logger(InboundMessageHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(body: YCloudWebhookInput): Promise<void> {
    const inbound = body.whatsappInboundMessage;
    if (!inbound) {
      this.logger.warn('Inbound event missing whatsappInboundMessage payload.');
      return;
    }

    const wamid = inbound.wamid ?? inbound.id;
    const customerName = inbound.customerProfile?.name;
    const messageText = inbound.text?.body;

    const clientPhone = inbound.to;
    if (!clientPhone) return;

    const whatsAppNumber = await this.prisma.whatsAppNumber.findUnique({
      where: { phoneNumber: clientPhone },
    });

    if (!whatsAppNumber) {
      this.logger.warn(
        `Received message for unregistered client phone number: ${clientPhone}`,
      );
      return;
    }

    // Persist to unified whatsapp_messages table (deduplicated by wamid)
    if (wamid) {
      const existing = await this.prisma.whatsappMessage.findUnique({
        where: { wamid },
      });
      if (existing) {
        this.logger.log(
          `WhatsApp message ${wamid} already stored. Skipping duplicate.`,
        );
      } else {
        await this.prisma.whatsappMessage.create({
          data: {
            whatsAppNumber: { connect: { id: whatsAppNumber.id } },
            wamid,
            wabaId: inbound.wabaId,
            fromNumber: inbound.from,
            toNumber: inbound.to,
            customerNumber: inbound.from ?? 'unknown',
            customerName,
            direction: 'INBOUND',
            messageType: inbound.type,
            messageText: messageText ?? '[Media or Non-text Message]',
            status: 'DELIVERED',
            sendTime: inbound.sendTime ? new Date(inbound.sendTime) : undefined,
          },
        });
        this.logger.log(`Stored inbound WhatsApp message ${wamid}.`);
      }
    }

    await this.prisma.whatsAppNumber.update({
      where: { id: whatsAppNumber.id },
      data: {
        messageCount: { increment: 1 },
        lastPing: new Date(),
        connectionStatus: 'ACTIVE',
      },
    });

    await this.prisma.onboardingStep.updateMany({
      where: { numberId: whatsAppNumber.id, stepNumber: { in: [4, 5, 6] } },
      data: { status: 'DONE' },
    });
  }
}
