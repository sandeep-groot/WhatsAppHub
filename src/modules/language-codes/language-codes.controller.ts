import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { LanguageCodesService } from './language-codes.service';

@ApiTags('whatsapp')
@ApiBearerAuth()
@Controller('whatsapp/languages')
export class LanguageCodesController {
  constructor(private readonly languageCodesService: LanguageCodesService) {}

  @Get()
  @Roles(RoleName.ADMIN, RoleName.OPERATOR, RoleName.VIEWER)
  @ApiOperation({ summary: 'List supported WhatsApp language codes' })
  findAll() {
    return this.languageCodesService.findAll();
  }
}
