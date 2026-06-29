import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LanguageCodesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns all supported WhatsApp language codes, ordered by language name. */
  findAll() {
    return this.prisma.languageCode.findMany({
      orderBy: { language: 'asc' },
      select: { code: true, language: true },
    });
  }
}
