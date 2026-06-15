import { Module } from '@nestjs/common';
import { YcloudHttpClient } from './ycloud-http.client';
import { YcloudWebhookEndpointsClient } from './ycloud-webhook-endpoints.client';

@Module({
  providers: [YcloudHttpClient, YcloudWebhookEndpointsClient],
  exports: [YcloudHttpClient, YcloudWebhookEndpointsClient],
})
export class YcloudBspModule {}