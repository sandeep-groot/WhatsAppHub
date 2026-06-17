import { Module } from '@nestjs/common';
import { YcloudBusinessAccountsClient } from './ycloud-business-accounts.client';
import { YcloudHttpClient } from './ycloud-http.client';
import { YcloudWebhookEndpointsClient } from './ycloud-webhook-endpoints.client';

@Module({
  providers: [
    YcloudHttpClient,
    YcloudWebhookEndpointsClient,
    YcloudBusinessAccountsClient,
  ],
  exports: [
    YcloudHttpClient,
    YcloudWebhookEndpointsClient,
    YcloudBusinessAccountsClient,
  ],
})
export class YcloudBspModule {}