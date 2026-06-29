import { Injectable, Logger } from '@nestjs/common';
import type { YCloudWebhookInput } from '../dto/ycloud-webhook.dto';

/**
 * Handles:
 *   whatsapp.template.category_updated
 *   whatsapp.template.quality_updated
 *   whatsapp.template.reviewed
 *
 * The Prisma schema has no dedicated template table yet, so this handler
 * logs the event details. Add persistence here once a Template model is added.
 */
@Injectable()
export class TemplateHandler {
  private readonly logger = new Logger(TemplateHandler.name);

  async handle(body: YCloudWebhookInput): Promise<void> {
    const tpl = body.whatsappTemplate;
    if (!tpl) {
      this.logger.warn(`${body.type}: missing whatsappTemplate payload.`);
      return;
    }

    const id = `${tpl.wabaId}/${tpl.name}/${tpl.language}`;

    switch (body.type) {
      case 'whatsapp.template.category_updated':
        this.logger.log(
          `Template ${id} category changed: ${tpl.previousCategory} → ${tpl.category}.`,
        );
        break;

      case 'whatsapp.template.quality_updated':
        this.logger.log(
          `Template ${id} quality rating: ${tpl.qualityRating}, status: ${tpl.status}.`,
        );
        break;

      case 'whatsapp.template.reviewed':
        this.logger.log(
          `Template ${id} review outcome: ${tpl.status} ` +
            `(event: ${tpl.statusUpdateEvent ?? 'n/a'})` +
            (tpl.reason ? ` — reason: ${tpl.reason}` : ''),
        );
        break;

      default:
        this.logger.log(`Unhandled template event: ${body.type}`);
    }
  }
}
