import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { YCloudWebhookInput } from '../dto/ycloud-webhook.dto';

/**
 * Handles:
 *   whatsapp.phone_number.deleted
 *   whatsapp.phone_number.name_updated
 *   whatsapp.phone_number.business_username_updated
 *   whatsapp.phone_number.quality_updated
 *
 * All four carry a `whatsappPhoneNumber` payload with at least `phoneNumber`.
 */
@Injectable()
export class PhoneNumberUpdatedHandler {
  private readonly logger = new Logger(PhoneNumberUpdatedHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(body: YCloudWebhookInput): Promise<void> {
    const phoneUpdate = body.whatsappPhoneNumber;
    if (!phoneUpdate?.phoneNumber) {
      this.logger.warn(
        `${body.type}: missing whatsappPhoneNumber.phoneNumber — skipping.`,
      );
      return;
    }

    const whatsAppNumber = await this.prisma.whatsAppNumber.findUnique({
      where: { phoneNumber: phoneUpdate.phoneNumber },
    });

    if (!whatsAppNumber) {
      this.logger.warn(
        `${body.type}: no WhatsAppNumber found for "${phoneUpdate.phoneNumber}" — skipping.`,
      );
      return;
    }

    switch (body.type) {
      case 'whatsapp.phone_number.deleted':
        await this.prisma.whatsAppNumber.update({
          where: { id: whatsAppNumber.id },
          data: { connectionStatus: 'INACTIVE', lastPing: new Date() },
        });
        this.logger.log(
          `Phone number ${phoneUpdate.phoneNumber} marked INACTIVE (deleted).`,
        );
        break;

      case 'whatsapp.phone_number.name_updated':
        this.logger.log(
          `Phone number ${phoneUpdate.phoneNumber} name review: ` +
            `decision=${phoneUpdate.decision ?? 'n/a'}, ` +
            `verifiedName="${phoneUpdate.requestedVerifiedName ?? 'n/a'}", ` +
            `rejection="${phoneUpdate.rejectionReason ?? 'NONE'}".`,
        );
        break;

      case 'whatsapp.phone_number.business_username_updated':
        this.logger.log(
          `Phone number ${phoneUpdate.phoneNumber} business username: ` +
            `@${phoneUpdate.businessUsername ?? 'n/a'} ` +
            `(status: ${phoneUpdate.businessUsernameStatus ?? 'n/a'}).`,
        );
        break;

      case 'whatsapp.phone_number.quality_updated': {
        const connectionStatus =
          phoneUpdate.status === 'CONNECTED' ? 'ACTIVE' : 'ERROR';
        await this.prisma.whatsAppNumber.update({
          where: { id: whatsAppNumber.id },
          data: { connectionStatus, lastPing: new Date() },
        });
        this.logger.log(
          `Phone number ${phoneUpdate.phoneNumber} quality update: ` +
            `rating=${phoneUpdate.qualityRating ?? 'n/a'}, ` +
            `limit=${phoneUpdate.messagingLimit ?? 'n/a'}, ` +
            `event=${phoneUpdate.qualityUpdateEvent ?? 'n/a'}, ` +
            `→ connectionStatus=${connectionStatus}.`,
        );
        break;
      }

      default:
        this.logger.log(`Unhandled phone number event: ${body.type}`);
    }
  }
}
