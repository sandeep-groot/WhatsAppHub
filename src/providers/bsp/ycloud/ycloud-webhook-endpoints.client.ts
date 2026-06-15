import { Injectable } from '@nestjs/common';
import { YcloudHttpClient } from './ycloud-http.client';
import {
  YCloudCreateWebhookEndpointPayload,
  YCloudListWebhookEndpointsResponse,
  YCloudUpdateWebhookEndpointPayload,
  YCloudWebhookEndpoint,
} from './ycloud.types';

export type ListWebhookEndpointsParams = {
  page?: number;
  limit?: number;
  includeTotal?: boolean;
};

@Injectable()
export class YcloudWebhookEndpointsClient {
  constructor(private readonly http: YcloudHttpClient) {}

  create(payload: YCloudCreateWebhookEndpointPayload) {
    return this.http.request<YCloudWebhookEndpoint>({
      method: 'POST',
      path: '/webhookEndpoints',
      body: payload,
    });
  }

  list(params: ListWebhookEndpointsParams = {}) {
    return this.http.request<YCloudListWebhookEndpointsResponse>({
      method: 'GET',
      path: '/webhookEndpoints',
      query: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        includeTotal: params.includeTotal ?? false,
      },
    });
  }

  getById(id: string) {
    return this.http.request<YCloudWebhookEndpoint>({
      method: 'GET',
      path: `/webhookEndpoints/${id}`,
    });
  }

  update(id: string, payload: YCloudUpdateWebhookEndpointPayload) {
    return this.http.request<YCloudWebhookEndpoint>({
      method: 'PATCH',
      path: `/webhookEndpoints/${id}`,
      body: payload,
    });
  }

  delete(id: string) {
    return this.http.request<unknown>({
      method: 'DELETE',
      path: `/webhookEndpoints/${id}`,
    });
  }

  rotateSecret(id: string) {
    return this.http.request<YCloudWebhookEndpoint>({
      method: 'POST',
      path: `/webhookEndpoints/${id}/rotateSecret`,
    });
  }
}