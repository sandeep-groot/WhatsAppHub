import { Module } from '@nestjs/common';
import { YcloudBusinessAccountsClient } from './ycloud-business-accounts.client';
import { YcloudHttpClient } from './ycloud-http.client';
import { YcloudMessagesClient } from './ycloud-messages.client';
import { YcloudPhoneNumbersClient } from './ycloud-phone-numbers.client';
import { YcloudTemplatesClient } from './ycloud-templates.client';
import { YcloudWebhookEndpointsClient } from './ycloud-webhook-endpoints.client';

@Module({
  providers: [
    YcloudHttpClient,
    YcloudWebhookEndpointsClient,
    YcloudBusinessAccountsClient,
    YcloudPhoneNumbersClient,
    YcloudMessagesClient,
    YcloudTemplatesClient,
  ],
  exports: [
    YcloudHttpClient,
    YcloudWebhookEndpointsClient,
    YcloudBusinessAccountsClient,
    YcloudPhoneNumbersClient,
    YcloudMessagesClient,
    YcloudTemplatesClient,
  ],
})
export class YcloudBspModule {}