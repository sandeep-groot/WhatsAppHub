import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { ListPhoneNumbersQueryDto } from './dto/phone-number.dto';
import { PhoneNumbersService } from './phone-numbers.service';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('integrations/ycloud/whatsapp/phone-numbers')
export class PhoneNumbersController {
  constructor(private readonly phoneNumbersService: PhoneNumbersService) {}

  @Get()
  @Roles(RoleName.ADMIN, RoleName.OPERATOR, RoleName.VIEWER)
  @ApiOperation({
    summary: 'List connected WhatsApp phone numbers from YCloud',
  })
  list(@Query() query: ListPhoneNumbersQueryDto) {
    return this.phoneNumbersService.list(query);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN, RoleName.OPERATOR, RoleName.VIEWER)
  @ApiOperation({ summary: 'Retrieve a WhatsApp phone number by id' })
  getById(@Param('id') id: string) {
    return this.phoneNumbersService.getById(id);
  }
}
