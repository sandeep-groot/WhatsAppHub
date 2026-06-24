import { Injectable } from '@nestjs/common';
import { YcloudPhoneNumbersClient } from '../../providers/bsp/ycloud/ycloud-phone-numbers.client';
import { ListPhoneNumbersQueryInput } from './dto/phone-number.dto';

@Injectable()
export class PhoneNumbersService {
  constructor(
    private readonly ycloudPhoneNumbers: YcloudPhoneNumbersClient,
  ) {}

  list(query: ListPhoneNumbersQueryInput) {
    return this.ycloudPhoneNumbers.list(query);
  }

  getById(wabaId: string, phoneNumber: string) {
    return this.ycloudPhoneNumbers.getById(wabaId, phoneNumber);
  }
}
