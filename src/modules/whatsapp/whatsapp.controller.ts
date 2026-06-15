import { Controller, Post, Get, Body, Headers, Param, Query, UnauthorizedException, RawBody } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
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
    @RawBody() rawBody: Buffer,
  ) {
    const verified = this.whatsappService.verifyWebhookSignature(signature, rawBody);
    if (!verified) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    return this.whatsappService.handleWebhook(body);
  }

  @ApiBearerAuth()
  @Get('clients')
  @ApiOperation({ summary: 'Fetch all clients and their registered numbers' })
  async getClients() {
    return this.whatsappService.getClients();
  }

  @ApiBearerAuth()
  @Get('numbers')
  @ApiOperation({ summary: 'List all WhatsApp number connections and status metrics' })
  async getNumbers() {
    return this.whatsappService.getNumbers();
  }

  @ApiBearerAuth()
  @Get('numbers/:id/messages')
  @ApiOperation({ summary: 'Retrieve conversation logs for a registered number' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getMessages(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.whatsappService.getMessages(id, startDate, endDate);
  }
}
