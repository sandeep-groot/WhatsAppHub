import { Module } from '@nestjs/common';
import { YcloudBspModule } from '../../providers/bsp/ycloud/ycloud-bsp.module';
import { WebhookEndpointsController } from './webhook-endpoints.controller';
import { WebhookEndpointsService } from './webhook-endpoints.service';

@Module({
  imports: [YcloudBspModule],
  controllers: [WebhookEndpointsController],
  providers: [WebhookEndpointsService],
  exports: [WebhookEndpointsService],
})
export class IntegrationsModule {}