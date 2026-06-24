import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { YCloudWebhookInput } from '../dto/ycloud-webhook.dto';

@Injectable()
export class MessageUpdatedHandler {
  private readonly logger = new Logger(MessageUpdatedHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(body: YCloudWebhookInput): Promise<void> {
    const messageUpdate = body.whatsappMessage as
      | { id?: string; status?: string }
      | undefined;
    if (!messageUpdate?.id || !messageUpdate.status) return;

    const existingMessage = await this.prisma.message.findUnique({
      where: { ycloudMessageId: messageUpdate.id },
    });

    if (existingMessage) {
      await this.prisma.message.update({
        where: { id: existingMessage.id },
        data: { status: messageUpdate.status },
      });
      this.logger.log(
        `Message ${messageUpdate.id} status updated to ${messageUpdate.status}.`,
      );
    }
  }
}
