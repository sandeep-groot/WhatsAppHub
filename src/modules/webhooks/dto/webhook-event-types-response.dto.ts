import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

// ─── Response DTOs ────────────────────────────────────────────────────────────

export class WebhookEventTypeItemDto {
  @ApiProperty({ example: 'evt-type-cuid' })
  id: string;

  @ApiProperty({ example: 'whatsapp.inbound_message.received' })
  type: string;

  @ApiProperty({ example: 'Inbound Message Received' })
  label: string;

  @ApiProperty({ example: 'Messages' })
  category: string;

  @ApiProperty({ example: 'Fired when a customer sends a message to your number.' })
  description: string;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class WebhookEventTypeGroupDto {
  @ApiProperty({ example: 'Messages' })
  category: string;

  @ApiProperty({ type: [WebhookEventTypeItemDto] })
  events: WebhookEventTypeItemDto[];
}

export class WebhookEventTypesResponseDto {
  @ApiProperty({ type: [WebhookEventTypeItemDto] })
  flat: WebhookEventTypeItemDto[];

  @ApiProperty({ type: [WebhookEventTypeGroupDto] })
  grouped: WebhookEventTypeGroupDto[];
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export class CreateWebhookEventTypeDto {
  @ApiProperty({
    example: 'whatsapp.custom_event.received',
    description:
      'Unique machine key for the event type. Use dot-separated lowercase notation.',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+(\.[a-z0-9_]+)+$/, {
    message:
      'type must be dot-separated lowercase alphanumeric/underscore segments, e.g. "whatsapp.inbound_message.received"',
  })
  type: string;

  @ApiProperty({ example: 'Custom Event Received' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'Custom Events' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Fired when a custom event is received.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this event type is visible in the dropdown. Defaults to true.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateWebhookEventTypeDto extends PartialType(
  CreateWebhookEventTypeDto,
) {}
