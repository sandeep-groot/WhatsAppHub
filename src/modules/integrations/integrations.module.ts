import { Module } from '@nestjs/common';
import { YcloudBspModule } from '../../providers/bsp/ycloud/ycloud-bsp.module';
import { BusinessAccountsController } from './business-accounts.controller';
import { BusinessAccountsService } from './business-accounts.service';
import { WebhookEndpointsController } from './webhook-endpoints.controller';
import { WebhookEndpointsService } from './webhook-endpoints.service';

@Module({
  imports: [YcloudBspModule],
  controllers: [WebhookEndpointsController, BusinessAccountsController],
  providers: [WebhookEndpointsService, BusinessAccountsService],
  exports: [WebhookEndpointsService, BusinessAccountsService],
})
export class IntegrationsModule {}