import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClientDetailsService } from './client-details.service';
import { CreateClientDetailDto } from './dto/create-client-detail.dto';
import { UpdateClientDetailDto } from './dto/update-client-detail.dto';

@ApiTags('client-details')
@ApiBearerAuth()
@Controller('client-details')
export class ClientDetailsController {
  constructor(private readonly clientDetailsService: ClientDetailsService) {}

  @Get()
  @ApiOperation({ summary: 'List all registered client details' })
  @ApiResponse({ status: 200, description: 'List of client details retrieved successfully.' })
  findAll() {
    return this.clientDetailsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client details by ID' })
  @ApiResponse({ status: 200, description: 'Client detail record retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Client detail record not found.' })
  findOne(@Param('id') id: string) {
    return this.clientDetailsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new client details record' })
  @ApiResponse({ status: 201, description: 'Client detail record created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request / Invalid payload.' })
  @ApiResponse({ status: 409, description: 'Conflict / Email already registered.' })
  create(@Body() dto: CreateClientDetailDto) {
    return this.clientDetailsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client details record' })
  @ApiResponse({ status: 200, description: 'Client detail record updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request / Invalid payload.' })
  @ApiResponse({ status: 404, description: 'Client detail record not found.' })
  @ApiResponse({ status: 409, description: 'Conflict / Email already registered.' })
  update(@Param('id') id: string, @Body() dto: UpdateClientDetailDto) {
    return this.clientDetailsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete client details record' })
  @ApiResponse({ status: 200, description: 'Client detail record deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request / Portfolios still linked.' })
  @ApiResponse({ status: 404, description: 'Client detail record not found.' })
  remove(@Param('id') id: string) {
    return this.clientDetailsService.remove(id);
  }
}
