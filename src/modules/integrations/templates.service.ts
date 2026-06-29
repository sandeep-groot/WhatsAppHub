import { Injectable } from '@nestjs/common';
import { YcloudTemplatesClient } from '../../providers/bsp/ycloud/ycloud-templates.client';
import {
  ListTemplatesQueryInput,
  UpdateTemplateInput,
} from './dto/template.dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly ycloudTemplates: YcloudTemplatesClient) {}

  list(query: ListTemplatesQueryInput) {
    return this.ycloudTemplates.list(query);
  }

  getById(wabaId: string, name: string, language: string) {
    return this.ycloudTemplates.getById(wabaId, name, language);
  }

  update(
    wabaId: string,
    name: string,
    language: string,
    payload: UpdateTemplateInput,
  ) {
    return this.ycloudTemplates.update(wabaId, name, language, payload);
  }

  delete(wabaId: string, name: string, language: string) {
    return this.ycloudTemplates.delete(wabaId, name, language);
  }

  deleteByName(wabaId: string, name: string) {
    return this.ycloudTemplates.deleteByName(wabaId, name);
  }
}
