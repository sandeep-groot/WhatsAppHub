import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessAccountsService } from './business-accounts.service';
import { ListBusinessAccountsQueryDto } from './dto/business-account.dto';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('integrations/ycloud/whatsapp/business-accounts')
export class BusinessAccountsController {
  constructor(
    private readonly businessAccountsService: BusinessAccountsService,
  ) {}

  @Get()
  @Roles(RoleName.ADMIN, RoleName.OPERATOR, RoleName.VIEWER)
  @ApiOperation({ summary: 'List WhatsApp Business Accounts (WABAs) from YCloud' })
  list(@Query() query: ListBusinessAccountsQueryDto) {
    return this.businessAccountsService.list(query);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN, RoleName.OPERATOR, RoleName.VIEWER)
  @ApiOperation({ summary: 'Retrieve a WhatsApp Business Account (WABA) by id' })
  getById(@Param('id') id: string) {
    return this.businessAccountsService.getById(id);
  }
}
