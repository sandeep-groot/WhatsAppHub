import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { YCloudWebhookInput } from '../dto/ycloud-webhook.dto';

@Injectable()
export class PhoneNumberUpdatedHandler {
  private readonly logger = new Logger(PhoneNumberUpdatedHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(body: YCloudWebhookInput): Promise<void> {
    const phoneUpdate = (body.whatsappPhoneNumber ??
      (body as Record<string, unknown>).data) as
      | { phoneNumber?: string; status?: string }
      | undefined;
    if (!phoneUpdate?.phoneNumber) return;

    const whatsAppNumber = await this.prisma.whatsAppNumber.findUnique({
      where: { phoneNumber: phoneUpdate.phoneNumber },
    });

    if (whatsAppNumber) {
      const connectionStatus =
        phoneUpdate.status === 'CONNECTED' ? 'ACTIVE' : 'ERROR';
      await this.prisma.whatsAppNumber.update({
        where: { id: whatsAppNumber.id },
        data: { connectionStatus, lastPing: new Date() },
      });
      this.logger.log(
        `Phone number ${phoneUpdate.phoneNumber} updated to ${connectionStatus} (raw: ${phoneUpdate.status}).`,
      );
    }
  }
}
