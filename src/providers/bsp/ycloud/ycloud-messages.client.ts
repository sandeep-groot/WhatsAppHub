import { Injectable } from '@nestjs/common';
import { YcloudHttpClient } from './ycloud-http.client';
import {
  YCloudSendMessagePayload,
  YCloudSendMessageResponse,
} from './ycloud.types';

@Injectable()
export class YcloudMessagesClient {
  constructor(private readonly http: YcloudHttpClient) {}

  /** Sends a WhatsApp message (text or template) immediately via YCloud. */
  sendDirectly(payload: YCloudSendMessagePayload) {
    return this.http.request<YCloudSendMessageResponse>({
      method: 'POST',
      path: '/whatsapp/messages/sendDirectly',
      body: payload,
    });
  }
}
