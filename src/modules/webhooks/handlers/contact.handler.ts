import { Injectable, Logger } from '@nestjs/common';
import type { YCloudWebhookInput } from '../dto/ycloud-webhook.dto';

/**
 * Handles:
 *   contact.created
 *   contact.deleted
 *   contact.attributes_changed
 *   contact.unsubscribe.created
 *   contact.unsubscribe.deleted
 *
 * No Contact model exists in the Prisma schema yet. All events are logged with
 * their key identifiers so they can be correlated with the raw WebhookEvent row.
 * Add a Contact / ContactUnsubscriber model and persist here when needed.
 */
@Injectable()
export class ContactHandler {
  private readonly logger = new Logger(ContactHandler.name);

  async handle(body: YCloudWebhookInput): Promise<void> {
    switch (body.type) {
      case 'contact.created':
        this.handleCreated(body);
        break;
      case 'contact.deleted':
        this.handleDeleted(body);
        break;
      case 'contact.attributes_changed':
        this.handleAttributesChanged(body);
        break;
      case 'contact.unsubscribe.created':
      case 'contact.unsubscribe.deleted':
        this.handleUnsubscriber(body);
        break;
      default:
        this.logger.log(`Unhandled contact event: ${body.type}`);
    }
  }

  private handleCreated(body: YCloudWebhookInput): void {
    const c = body.contactCreated;
    if (!c) {
      this.logger.warn('contact.created: missing contactCreated payload.');
      return;
    }
    this.logger.log(
      `Contact created — id: ${c.id}, phone: ${c.phoneNumber}, ` +
        `name: ${c.nickName ?? c.realName ?? 'n/a'}.`,
    );
  }

  private handleDeleted(body: YCloudWebhookInput): void {
    const c = body.contactDeleted;
    if (!c) {
      this.logger.warn('contact.deleted: missing contactDeleted payload.');
      return;
    }
    this.logger.log(
      `Contact deleted — id: ${c.id}, phone: ${c.phoneNumber}.`,
    );
  }

  private handleAttributesChanged(body: YCloudWebhookInput): void {
    const c = body.contactAttributesChanged;
    if (!c) {
      this.logger.warn(
        'contact.attributes_changed: missing contactAttributesChanged payload.',
      );
      return;
    }
    const attrs = Object.keys(c.changedAttributes ?? {}).join(', ') || 'none';
    this.logger.log(
      `Contact attributes changed — id: ${c.id}, changed: [${attrs}].`,
    );
  }

  private handleUnsubscriber(body: YCloudWebhookInput): void {
    const u = body.unsubscriberChanged;
    if (!u) {
      this.logger.warn(`${body.type}: missing unsubscriberChanged payload.`);
      return;
    }
    const action =
      body.type === 'contact.unsubscribe.created' ? 'unsubscribed' : 'resubscribed';
    this.logger.log(
      `Contact ${action} — id: ${u.id}, phone: ${u.phoneNumber}, source: ${u.source}.`,
    );
  }
}
