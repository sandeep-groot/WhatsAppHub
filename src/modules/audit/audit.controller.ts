import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(RoleName.ADMIN, RoleName.OPERATOR, RoleName.VIEWER)
  @ApiOperation({ summary: 'Query audit logs (paginated, filterable)' })
  findAll(@Query() query: AuditLogQueryDto) {
    return this.auditService.findMany(query);
  }
}
