import { Injectable } from '@nestjs/common';
import { YcloudHttpClient } from './ycloud-http.client';
import {
  YCloudListWhatsAppPhoneNumbersResponse,
  YCloudWhatsAppPhoneNumber,
} from './ycloud.types';

export type ListPhoneNumbersParams = {
  page?: number;
  limit?: number;
  includeTotal?: boolean;
  wabaId?: string;
};

@Injectable()
export class YcloudPhoneNumbersClient {
  constructor(private readonly http: YcloudHttpClient) {}

  list(params: ListPhoneNumbersParams = {}) {
    return this.http.request<YCloudListWhatsAppPhoneNumbersResponse>({
      method: 'GET',
      path: '/whatsapp/phoneNumbers',
      query: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        includeTotal: params.includeTotal ?? false,
        wabaId: params.wabaId,
      },
    });
  }

  getById(wabaId: string, phoneNumber: string) {
    return this.http.request<YCloudWhatsAppPhoneNumber>({
      method: 'GET',
      path: `/whatsapp/phoneNumbers/${wabaId}/${phoneNumber}`,
    });
  }
}
