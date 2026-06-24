import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { InboundMessageHandler } from './handlers/inbound-message.handler';
import { MessageUpdatedHandler } from './handlers/message-updated.handler';
import { PhoneNumberUpdatedHandler } from './handlers/phone-number-updated.handler';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [RealtimeModule],
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    InboundMessageHandler,
    MessageUpdatedHandler,
    PhoneNumberUpdatedHandler,
  ],
})
export class WebhooksModule {}
