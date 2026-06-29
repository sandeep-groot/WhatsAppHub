import { Module } from '@nestjs/common';
import { YcloudBspModule } from '../../providers/bsp/ycloud/ycloud-bsp.module';
import { AuditModule } from '../audit/audit.module';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [AuditModule, YcloudBspModule],
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
