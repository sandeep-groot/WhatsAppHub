import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    const dbHealthy = await this.prisma.isHealthy();
    return {
      status: dbHealthy ? 'ok' : 'degraded',
      checks: { database: dbHealthy ? 'up' : 'down' },
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('live')
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  async ready() {
    const dbHealthy = await this.prisma.isHealthy();
    if (!dbHealthy) {
      throw new ServiceUnavailableException({
        status: 'error',
        checks: { database: 'down' },
        timestamp: new Date().toISOString(),
      });
    }
    return {
      status: 'ok',
      checks: { database: 'up' },
      timestamp: new Date().toISOString(),
    };
  }
}
