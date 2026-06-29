import { Injectable, Logger } from '@nestjs/common';
import type { YCloudWebhookInput } from '../dto/ycloud-webhook.dto';

/**
 * Handles:
 *   whatsapp.user.preferences
 *
 * Fired when a customer opts in or out of a messaging category (e.g. marketing).
 * No dedicated model exists yet — logs the preference change for observability.
 * Add opt-in/out persistence here once a model is available.
 */
@Injectable()
export class UserPreferencesHandler {
  private readonly logger = new Logger(UserPreferencesHandler.name);

  async handle(body: YCloudWebhookInput): Promise<void> {
    const pref = body.whatsappUserPreference;
    if (!pref) {
      this.logger.warn(
        'whatsapp.user.preferences: missing whatsappUserPreference payload.',
      );
      return;
    }

    this.logger.log(
      `User preference update — phone: ${pref.contactPhoneNumber}, ` +
        `category: ${pref.category}, value: ${pref.value}, ` +
        `wabaId: ${pref.wabaId}, detail: "${pref.detail ?? 'n/a'}".`,
    );
  }
}
