import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { WabaBindDto } from './dto/waba-bind.dto';
import { WhatsappService } from './whatsapp.service';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @ApiBearerAuth()
  @Post('waba/bind')
  @ApiOperation({ summary: 'Bind WABA and Register Phone Number via YCloud' })
  async bind(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: WabaBindDto,
  ) {
    return this.whatsappService.bindWabaAndNumber(dto, user.id);
  }

  @Public()
  @Post('webhooks')
  @ApiOperation({ summary: 'YCloud Webhook integration endpoint' })
  async handleWebhook(
    @Headers('ycloud-signature') signature: string,
    @Body() body: any,
  ) {
    const verified = this.whatsappService.verifyWebhookSignature(signature, body);
    if (!verified) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    return this.whatsappService.handleWebhook(body);
  }
}
