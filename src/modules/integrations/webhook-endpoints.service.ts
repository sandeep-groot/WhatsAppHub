import { Injectable } from '@nestjs/common';
import { YcloudWebhookEndpointsClient } from '../../providers/bsp/ycloud/ycloud-webhook-endpoints.client';
import {
  CreateWebhookEndpointInput,
  ListWebhookEndpointsQueryInput,
  UpdateWebhookEndpointInput,
} from './dto/webhook-endpoint.dto';

@Injectable()
export class WebhookEndpointsService {
  constructor(
    private readonly ycloudWebhookEndpoints: YcloudWebhookEndpointsClient,
  ) {}

  create(dto: CreateWebhookEndpointInput) {
    return this.ycloudWebhookEndpoints.create(dto);
  }

  list(query: ListWebhookEndpointsQueryInput) {
    return this.ycloudWebhookEndpoints.list(query);
  }

  getById(id: string) {
    return this.ycloudWebhookEndpoints.getById(id);
  }

  update(id: string, dto: UpdateWebhookEndpointInput) {
    return this.ycloudWebhookEndpoints.update(id, dto);
  }

  delete(id: string) {
    return this.ycloudWebhookEndpoints.delete(id);
  }

  rotateSecret(id: string) {
    return this.ycloudWebhookEndpoints.rotateSecret(id);
  }
}