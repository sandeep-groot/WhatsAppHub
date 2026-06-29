import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { BusinessAccountHandler } from './handlers/business-account.handler';
import { ContactHandler } from './handlers/contact.handler';
import { InboundMessageHandler } from './handlers/inbound-message.handler';
import { MessageUpdatedHandler } from './handlers/message-updated.handler';
import { PaymentHandler } from './handlers/payment.handler';
import { PhoneNumberUpdatedHandler } from './handlers/phone-number-updated.handler';
import { SmbHandler } from './handlers/smb.handler';
import { TemplateHandler } from './handlers/template.handler';
import { UserPreferencesHandler } from './handlers/user-preferences.handler';
import { WebhookEventTypesService } from './webhook-event-types.service';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [RealtimeModule],
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    WebhookEventTypesService,
    // Message handlers
    InboundMessageHandler,
    MessageUpdatedHandler,
    // Phone number handler
    PhoneNumberUpdatedHandler,
    // Domain handlers
    BusinessAccountHandler,
    TemplateHandler,
    PaymentHandler,
    ContactHandler,
    SmbHandler,
    UserPreferencesHandler,
  ],
})
export class WebhooksModule {}
