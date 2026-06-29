import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateTemplateDto,
  ListTemplatesQueryDto,
  UpdateTemplateDto,
} from './dto/template.dto';
import { TemplatesService } from './templates.service';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('integrations/ycloud/whatsapp/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.OPERATOR)
  @ApiOperation({ summary: 'Create a WhatsApp message template via YCloud' })
  create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.OPERATOR, RoleName.VIEWER)
  @ApiOperation({ summary: 'List WhatsApp message templates from YCloud' })
  list(@Query() query: ListTemplatesQueryDto) {
    return this.templatesService.list(query);
  }

  @Get(':wabaId/:name/:language')
  @Roles(RoleName.ADMIN, RoleName.OPERATOR, RoleName.VIEWER)
  @ApiOperation({
    summary: 'Retrieve a template by wabaId, name and language code',
  })
  getById(
    @Param('wabaId') wabaId: string,
    @Param('name') name: string,
    @Param('language') language: string,
  ) {
    return this.templatesService.getById(wabaId, name, language);
  }

  @Patch(':wabaId/:name/:language')
  @Roles(RoleName.ADMIN, RoleName.OPERATOR)
  @ApiOperation({ summary: 'Edit a template by wabaId, name and language code' })
  update(
    @Param('wabaId') wabaId: string,
    @Param('name') name: string,
    @Param('language') language: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(wabaId, name, language, dto);
  }

  @Delete(':wabaId/:name/:language')
  @Roles(RoleName.ADMIN, RoleName.OPERATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a single localized template (by name + language code)',
  })
  delete(
    @Param('wabaId') wabaId: string,
    @Param('name') name: string,
    @Param('language') language: string,
  ) {
    return this.templatesService.delete(wabaId, name, language);
  }

  @Delete(':wabaId/:name')
  @Roles(RoleName.ADMIN, RoleName.OPERATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete all localizations of a template (by name)',
  })
  deleteByName(@Param('wabaId') wabaId: string, @Param('name') name: string) {
    return this.templatesService.deleteByName(wabaId, name);
  }
}
