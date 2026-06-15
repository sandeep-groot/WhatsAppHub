import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateWebhookEndpointDto,
  ListWebhookEndpointsQueryDto,
  UpdateWebhookEndpointDto,
} from './dto/webhook-endpoint.dto';
import { WebhookEndpointsService } from './webhook-endpoints.service';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('integrations/ycloud/webhook-endpoints')
export class WebhookEndpointsController {
  constructor(
    private readonly webhookEndpointsService: WebhookEndpointsService,
  ) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.OPERATOR)
  @ApiOperation({ summary: 'Create a YCloud webhook endpoint' })
  create(@Body() dto: CreateWebhookEndpointDto) {
    return this.webhookEndpointsService.create(dto);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.OPERATOR, RoleName.VIEWER)
  @ApiOperation({ summary: 'List YCloud webhook endpoints' })
  list(@Query() query: ListWebhookEndpointsQueryDto) {
    return this.webhookEndpointsService.list(query);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN, RoleName.OPERATOR, RoleName.VIEWER)
  @ApiOperation({ summary: 'Retrieve a YCloud webhook endpoint by id' })
  getById(@Param('id') id: string) {
    return this.webhookEndpointsService.getById(id);
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN, RoleName.OPERATOR)
  @ApiOperation({ summary: 'Update a YCloud webhook endpoint' })
  update(@Param('id') id: string, @Body() dto: UpdateWebhookEndpointDto) {
    return this.webhookEndpointsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN, RoleName.OPERATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a YCloud webhook endpoint' })
  delete(@Param('id') id: string) {
    return this.webhookEndpointsService.delete(id);
  }

  @Post(':id/rotate-secret')
  @Roles(RoleName.ADMIN, RoleName.OPERATOR)
  @ApiOperation({ summary: 'Rotate YCloud webhook endpoint secret' })
  rotateSecret(@Param('id') id: string) {
    return this.webhookEndpointsService.rotateSecret(id);
  }
}