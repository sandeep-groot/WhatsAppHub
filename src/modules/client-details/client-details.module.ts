import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ClientDetailsController } from './client-details.controller';
import { ClientDetailsService } from './client-details.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClientDetailsController],
  providers: [ClientDetailsService],
  exports: [ClientDetailsService],
})
export class ClientDetailsModule {}
