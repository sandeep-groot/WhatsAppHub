import { Injectable } from '@nestjs/common';
import { YcloudBusinessAccountsClient } from '../../providers/bsp/ycloud/ycloud-business-accounts.client';
import { ListBusinessAccountsQueryInput } from './dto/business-account.dto';

@Injectable()
export class BusinessAccountsService {
  constructor(
    private readonly ycloudBusinessAccounts: YcloudBusinessAccountsClient,
  ) {}

  list(query: ListBusinessAccountsQueryInput) {
    return this.ycloudBusinessAccounts.list(query);
  }

  getById(id: string) {
    return this.ycloudBusinessAccounts.getById(id);
  }
}
