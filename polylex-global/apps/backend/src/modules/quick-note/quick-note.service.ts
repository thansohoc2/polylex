import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuickNoteDto } from './dto/quick-note.dto';
import { QuickNoteStatus } from '@prisma/client';

export const QUICK_NOTE_QUEUE = 'quick-note-enrichment';
export const ENRICH_JOB = 'enrich';

@Injectable()
export class QuickNoteService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUICK_NOTE_QUEUE) private readonly queue: Queue,
  ) {}

  async create(userId: string, dto: CreateQuickNoteDto, role?: string, email?: string) {
    const isDemoUser = role === 'DEMO' || email?.endsWith('@polylex.guest');

    if (isDemoUser) {
      const demoNoteCount = await this.prisma.quickNote.count({
        where: { userId },
      });
      if (demoNoteCount >= 3) {
        throw new ForbiddenException('DEMO_NOTE_LIMIT_REACHED');
      }
    }

    const note = await this.prisma.quickNote.create({
      data: {
        userId,
        term: dto.term.trim(),
        sourceLanguageCode: dto.sourceLanguageCode,
        targetLanguageCode: dto.targetLanguageCode,
        status: QuickNoteStatus.PENDING,
      },
    });

    // Dispatch to processing queue
    await this.queue.add(
      ENRICH_JOB,
      { quickNoteId: note.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return note;
  }

  async findAll(userId: string) {
    return this.prisma.quickNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        vocabularyBase: {
          include: { language: true, translations: true },
        },
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.prisma.quickNote.findFirstOrThrow({ where: { id, userId } });
    await this.prisma.quickNote.delete({ where: { id } });
    return { success: true };
  }
}
