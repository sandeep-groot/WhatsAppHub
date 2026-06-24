import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  RawBody,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { YCloudWebhookDto } from './dto/ycloud-webhook.dto';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Public()
  @Post('ycloud')
  @HttpCode(200)
  @ApiOperation({
    summary: 'YCloud webhook ingestion endpoint (stores and processes events)',
  })
  async handleYcloud(
    @Headers('ycloud-signature') signature: string | undefined,
    @Body() body: YCloudWebhookDto,
    @RawBody() rawBody: Buffer,
  ) {
    const signatureValid = this.webhooksService.verifySignature(
      signature,
      rawBody,
    );
    await this.webhooksService.processEvent(body, signatureValid);
    return { received: true };
  }
}
