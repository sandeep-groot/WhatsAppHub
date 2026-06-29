import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { YCloudWebhookInput } from '../dto/ycloud-webhook.dto';

/**
 * Handles:
 *   whatsapp.business_account.deleted
 *   whatsapp.business_account.updated
 *
 * Both events carry a `whatsappBusinessAccount` payload.
 * We reflect status changes onto the matching Client row (keyed by wabaId).
 */
@Injectable()
export class BusinessAccountHandler {
  private readonly logger = new Logger(BusinessAccountHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(body: YCloudWebhookInput): Promise<void> {
    const account = body.whatsappBusinessAccount;
    if (!account?.id) {
      this.logger.warn(
        `${body.type}: missing whatsappBusinessAccount.id — skipping.`,
      );
      return;
    }

    const wabaId = account.id;
    const isDeleted = body.type === 'whatsapp.business_account.deleted';

    const client = await this.prisma.client.findUnique({ where: { wabaId } });

    if (!client) {
      this.logger.warn(
        `${body.type}: no Client found for wabaId "${wabaId}" — nothing to update.`,
      );
      return;
    }

    const newStatus = isDeleted ? 'DELETED' : this.resolveStatus(account);

    await this.prisma.client.update({
      where: { id: client.id },
      data: { status: newStatus },
    });

    this.logger.log(
      `Client "${client.name}" (wabaId: ${wabaId}) status set to "${newStatus}" ` +
        `via ${body.type}.`,
    );
  }

  /**
   * Maps YCloud account state to a simple internal status string.
   * banState takes priority; otherwise fall back to accountReviewStatus.
   */
  private resolveStatus(
    account: NonNullable<YCloudWebhookInput['whatsappBusinessAccount']>,
  ): string {
    if (account.banState) {
      return account.banState === 'REINSTATE' ? 'ACTIVE' : 'BANNED';
    }
    if (account.accountReviewStatus === 'APPROVED') return 'ACTIVE';
    if (account.accountReviewStatus === 'REJECTED') return 'REJECTED';
    return 'ACTIVE';
  }
}
