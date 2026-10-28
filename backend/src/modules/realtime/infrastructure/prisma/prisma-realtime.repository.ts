import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { RealtimeRepository } from '../../domain/realtime.repository.js';
import { DocumentStatusEvent } from '../../domain/document-status-event.js';

@Injectable()
export class PrismaRealtimeRepository implements RealtimeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findDocumentStatus(id: string): Promise<DocumentStatusEvent | null> {
    return this.prisma.document.findUnique({
      where: { id },
      select: { id: true, status: true, updatedAt: true },
    });
  }
}
