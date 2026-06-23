import { Module } from '@nestjs/common';
import { YcloudBspModule } from '../../providers/bsp/ycloud/ycloud-bsp.module';
import { BusinessAccountsController } from './business-accounts.controller';
import { BusinessAccountsService } from './business-accounts.service';
import { PhoneNumbersController } from './phone-numbers.controller';
import { PhoneNumbersService } from './phone-numbers.service';
import { WebhookEndpointsController } from './webhook-endpoints.controller';
import { WebhookEndpointsService } from './webhook-endpoints.service';

@Module({
  imports: [YcloudBspModule],
  controllers: [
    WebhookEndpointsController,
    BusinessAccountsController,
    PhoneNumbersController,
  ],
  providers: [
    WebhookEndpointsService,
    BusinessAccountsService,
    PhoneNumbersService,
  ],
  exports: [
    WebhookEndpointsService,
    BusinessAccountsService,
    PhoneNumbersService,
  ],
})
export class IntegrationsModule {}