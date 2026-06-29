import { Injectable, Logger } from '@nestjs/common';
import type { YCloudWebhookInput } from '../dto/ycloud-webhook.dto';

/**
 * Handles:
 *   whatsapp.payment.updated
 *
 * No payment model exists in the Prisma schema yet. This handler logs all
 * relevant details so the raw payload in WebhookEvent is accompanied by a
 * structured log entry. Add a Payment model and persist here when needed.
 */
@Injectable()
export class PaymentHandler {
  private readonly logger = new Logger(PaymentHandler.name);

  async handle(body: YCloudWebhookInput): Promise<void> {
    const payment = body.whatsappPayment;
    if (!payment) {
      this.logger.warn('whatsapp.payment.updated: missing whatsappPayment payload.');
      return;
    }

    const txSummary = (payment.transactions ?? [])
      .map((tx) => `[${tx.id} ${tx.type} ${tx.status}]`)
      .join(', ');

    this.logger.log(
      `Payment ${payment.referenceId} (wabaId: ${payment.wabaId}) ` +
        `status="${payment.status}" transactions=${txSummary || 'none'}.`,
    );
  }
}
