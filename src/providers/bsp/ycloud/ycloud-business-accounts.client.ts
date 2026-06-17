import { Injectable } from '@nestjs/common';
import { YcloudHttpClient } from './ycloud-http.client';
import {
  YCloudListWhatsAppBusinessAccountsResponse,
  YCloudWhatsAppBusinessAccount,
} from './ycloud.types';

export type ListBusinessAccountsParams = {
  page?: number;
  limit?: number;
  includeTotal?: boolean;
};

@Injectable()
export class YcloudBusinessAccountsClient {
  constructor(private readonly http: YcloudHttpClient) {}

  list(params: ListBusinessAccountsParams = {}) {
    return this.http.request<YCloudListWhatsAppBusinessAccountsResponse>({
      method: 'GET',
      path: '/whatsapp/businessAccounts',
      query: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        includeTotal: params.includeTotal ?? false,
      },
    });
  }

  getById(id: string) {
    return this.http.request<YCloudWhatsAppBusinessAccount>({
      method: 'GET',
      path: `/whatsapp/businessAccounts/${id}`,
    });
  }
}
