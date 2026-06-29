import { Injectable } from '@nestjs/common';
import { YcloudHttpClient } from './ycloud-http.client';
import {
  YCloudCreateTemplatePayload,
  YCloudListTemplatesResponse,
  YCloudUpdateTemplatePayload,
  YCloudWhatsAppTemplate,
} from './ycloud.types';

export type ListTemplatesParams = {
  page?: number;
  limit?: number;
  includeTotal?: boolean;
  wabaId?: string;
  name?: string;
};

@Injectable()
export class YcloudTemplatesClient {
  constructor(private readonly http: YcloudHttpClient) {}

  create(payload: YCloudCreateTemplatePayload) {
    return this.http.request<YCloudWhatsAppTemplate>({
      method: 'POST',
      path: '/whatsapp/templates',
      body: payload,
    });
  }

  list(params: ListTemplatesParams = {}) {
    return this.http.request<YCloudListTemplatesResponse>({
      method: 'GET',
      path: '/whatsapp/templates',
      query: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        includeTotal: params.includeTotal ?? false,
        wabaId: params.wabaId,
        name: params.name,
      },
    });
  }

  getById(wabaId: string, name: string, language: string) {
    return this.http.request<YCloudWhatsAppTemplate>({
      method: 'GET',
      path: `/whatsapp/templates/${wabaId}/${name}/${language}`,
    });
  }

  update(
    wabaId: string,
    name: string,
    language: string,
    payload: YCloudUpdateTemplatePayload,
  ) {
    return this.http.request<YCloudWhatsAppTemplate>({
      method: 'PATCH',
      path: `/whatsapp/templates/${wabaId}/${name}/${language}`,
      body: payload,
    });
  }

  /** Deletes a single localized template (by name + language code). */
  delete(wabaId: string, name: string, language: string) {
    return this.http.request<unknown>({
      method: 'DELETE',
      path: `/whatsapp/templates/${wabaId}/${name}/${language}`,
    });
  }

  /** Deletes all localizations of a template (by name). */
  deleteByName(wabaId: string, name: string) {
    return this.http.request<unknown>({
      method: 'DELETE',
      path: `/whatsapp/templates/${wabaId}/${name}`,
    });
  }
}
