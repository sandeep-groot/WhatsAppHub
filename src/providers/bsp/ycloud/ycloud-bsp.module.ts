import { Module } from '@nestjs/common';
import { YcloudBusinessAccountsClient } from './ycloud-business-accounts.client';
import { YcloudHttpClient } from './ycloud-http.client';
import { YcloudPhoneNumbersClient } from './ycloud-phone-numbers.client';
import { YcloudWebhookEndpointsClient } from './ycloud-webhook-endpoints.client';

@Module({
  providers: [
    YcloudHttpClient,
    YcloudWebhookEndpointsClient,
    YcloudBusinessAccountsClient,
    YcloudPhoneNumbersClient,
  ],
  exports: [
    YcloudHttpClient,
    YcloudWebhookEndpointsClient,
    YcloudBusinessAccountsClient,
    YcloudPhoneNumbersClient,
  ],
})
export class YcloudBspModule {}