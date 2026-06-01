import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'List users (paginated)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Get user by id' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  create(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.usersService.create(actor, dto);
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Update user profile or roles' })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(actor, id, dto);
  }

  @Post(':id/deactivate')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Deactivate a user account' })
  deactivate(@CurrentUser() actor: AuthenticatedUser, @Param('id') id: string) {
    return this.usersService.deactivate(actor, id);
  }
}
