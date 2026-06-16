import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LanguageDto } from '@polylex/shared-types';

@Injectable()
export class LanguagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<LanguageDto[]> {
    return this.prisma.language.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, nativeName: true, rtl: true, flagEmoji: true },
    });
  }
}
