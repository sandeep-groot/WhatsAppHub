import { Module } from '@nestjs/common';
import { YcloudBspModule } from '../../providers/bsp/ycloud/ycloud-bsp.module';
import { BusinessAccountsController } from './business-accounts.controller';
import { BusinessAccountsService } from './business-accounts.service';
import { PhoneNumbersController } from './phone-numbers.controller';
import { PhoneNumbersService } from './phone-numbers.service';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { WebhookEndpointsController } from './webhook-endpoints.controller';
import { WebhookEndpointsService } from './webhook-endpoints.service';

@Module({
  imports: [YcloudBspModule],
  controllers: [
    WebhookEndpointsController,
    BusinessAccountsController,
    PhoneNumbersController,
    TemplatesController,
  ],
  providers: [
    WebhookEndpointsService,
    BusinessAccountsService,
    PhoneNumbersService,
    TemplatesService,
  ],
  exports: [
    WebhookEndpointsService,
    BusinessAccountsService,
    PhoneNumbersService,
    TemplatesService,
  ],
})
export class IntegrationsModule {}