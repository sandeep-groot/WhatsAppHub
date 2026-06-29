import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  RawBody,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateWebhookEventTypeDto,
  UpdateWebhookEventTypeDto,
  WebhookEventTypeGroupDto,
  WebhookEventTypeItemDto,
  WebhookEventTypesResponseDto,
} from './dto/webhook-event-types-response.dto';
import { YCloudWebhookDto } from './dto/ycloud-webhook.dto';
import { WebhookEventTypesService } from './webhook-event-types.service';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@ApiBearerAuth()
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly webhookEventTypesService: WebhookEventTypesService,
  ) {}

  // =========================================================================
  // YCloud ingestion  — deliberately PUBLIC (called by YCloud servers, no JWT)
  // =========================================================================

  @Public()
  @Post('ycloud')
  @HttpCode(200)
  @ApiOperation({
    summary: 'YCloud webhook ingestion endpoint',
    description:
      'Receives events pushed by YCloud. Signature is verified via ' +
      'the ycloud-signature header. This endpoint is intentionally public ' +
      'because the caller is the YCloud platform, not an authenticated user.',
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

  // =========================================================================
  // Event type catalogue — JWT-authenticated reads, ADMIN writes
  // =========================================================================

  /**
   * GET /webhooks/event-types
   *
   * Requires a valid JWT.
   *
   * Use the optional `format` query param to control what is returned:
   *   ?format=flat    → WebhookEventTypeItemDto[]
   *   ?format=grouped → WebhookEventTypeGroupDto[]
   *   (omit)          → { flat, grouped } — both shapes together
   */
  @Get('event-types')
  @ApiOperation({
    summary: 'List active webhook event types for the subscription dropdown',
    description:
      'Returns active YCloud webhook event types. ' +
      'Supply `?format=flat` for a plain array (simple `<select>`), ' +
      '`?format=grouped` for a category-grouped array (optgroup / checklist), ' +
      'or omit the param to receive both shapes in a single response object.',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['flat', 'grouped'],
    description:
      'flat — returns a plain array of event types. ' +
      'grouped — returns an array of { category, events[] } objects. ' +
      'Omit to receive both.',
  })
  @ApiOkResponse({
    description:
      'When format=flat: WebhookEventTypeItemDto[]. ' +
      'When format=grouped: WebhookEventTypeGroupDto[]. ' +
      'When format is omitted: WebhookEventTypesResponseDto.',
  })
  async getEventTypes(
    @Query('format') format?: 'flat' | 'grouped',
  ): Promise<
    | WebhookEventTypeItemDto[]
    | WebhookEventTypeGroupDto[]
    | WebhookEventTypesResponseDto
  > {
    if (format === 'flat') {
      return this.webhookEventTypesService.findAll();
    }
    if (format === 'grouped') {
      return this.webhookEventTypesService.findGrouped();
    }
    // Default: return both shapes.
    const [flat, grouped] = await Promise.all([
      this.webhookEventTypesService.findAll(),
      this.webhookEventTypesService.findGrouped(),
    ]);
    return { flat, grouped };
  }

  /**
   * GET /webhooks/event-types/all
   * Admin — all rows including inactive, for the management screen.
   */
  @Roles('ADMIN')
  @Get('event-types/all')
  @ApiOperation({
    summary: 'List all webhook event types including inactive (admin)',
    description: 'Returns every event type row regardless of isActive status.',
  })
  @ApiOkResponse({ type: [WebhookEventTypeItemDto] })
  async getAllEventTypes(): Promise<WebhookEventTypeItemDto[]> {
    return this.webhookEventTypesService.findAllAdmin();
  }

  /**
   * GET /webhooks/event-types/:id
   * Admin — fetch a single event type by id.
   */
  @Roles('ADMIN')
  @Get('event-types/:id')
  @ApiOperation({ summary: 'Get a single webhook event type by id (admin)' })
  @ApiParam({ name: 'id', description: 'Event type record id (cuid)' })
  @ApiOkResponse({ type: WebhookEventTypeItemDto })
  async getEventType(
    @Param('id') id: string,
  ): Promise<WebhookEventTypeItemDto> {
    return this.webhookEventTypesService.findOne(id);
  }

  /**
   * POST /webhooks/event-types
   * Admin — create a custom event type not present in the built-in catalogue.
   */
  @Roles('ADMIN')
  @Post('event-types')
  @ApiOperation({
    summary: 'Create a new webhook event type (admin)',
    description:
      'Adds a custom event type to the catalogue. Built-in YCloud events are ' +
      'seeded automatically on startup; use this for custom or future events.',
  })
  @ApiCreatedResponse({ type: WebhookEventTypeItemDto })
  async createEventType(
    @Body() dto: CreateWebhookEventTypeDto,
  ): Promise<WebhookEventTypeItemDto> {
    return this.webhookEventTypesService.create(dto);
  }

  /**
   * PATCH /webhooks/event-types/:id
   * Admin — update any field including isActive.
   */
  @Roles('ADMIN')
  @Patch('event-types/:id')
  @ApiOperation({
    summary: 'Update a webhook event type (admin)',
    description:
      'All fields are optional. Set isActive=false to hide from the public ' +
      'dropdown without permanently deleting the record.',
  })
  @ApiParam({ name: 'id', description: 'Event type record id (cuid)' })
  @ApiOkResponse({ type: WebhookEventTypeItemDto })
  async updateEventType(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookEventTypeDto,
  ): Promise<WebhookEventTypeItemDto> {
    return this.webhookEventTypesService.update(id, dto);
  }

  /**
   * DELETE /webhooks/event-types/:id
   * Admin — permanently delete an event type.
   */
  @Roles('ADMIN')
  @Delete('event-types/:id')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Delete a webhook event type (admin)',
    description:
      'Hard-deletes the record. Built-in YCloud event types will be re-seeded ' +
      'on the next server restart — use PATCH isActive=false instead to ' +
      'permanently hide them from the dropdown.',
  })
  @ApiNoContentResponse({ description: 'Event type deleted.' })
  async deleteEventType(
    @Param('id') id: string,
  ): Promise<{ deleted: true; id: string }> {
    return this.webhookEventTypesService.remove(id);
  }
}
