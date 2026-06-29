import { Module } from '@nestjs/common';
import { LanguageCodesController } from './language-codes.controller';
import { LanguageCodesService } from './language-codes.service';

@Module({
  controllers: [LanguageCodesController],
  providers: [LanguageCodesService],
  exports: [LanguageCodesService],
})
export class LanguageCodesModule {}
