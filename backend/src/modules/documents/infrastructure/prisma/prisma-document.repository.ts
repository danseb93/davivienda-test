import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import {
  CreateDocumentData,
  DocumentProcessingResult,
  DocumentRepository,
  UpdateDocumentData,
} from '../../domain/document.repository.js';
import { Document } from '../../domain/document.entity.js';

@Injectable()
export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Document[]> {
    return this.prisma.document.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findById(id: string): Promise<Document | null> {
    return this.prisma.document.findUnique({ where: { id } });
  }

  create(data: CreateDocumentData): Promise<Document> {
    return this.prisma.document.create({ data });
  }

  update(id: string, data: UpdateDocumentData): Promise<Document> {
    return this.prisma.document.update({ where: { id }, data });
  }

  delete(id: string): Promise<Document> {
    return this.prisma.document.delete({ where: { id } });
  }

  processNextPending(
    extractContent: (document: Document) => Promise<string>,
  ): Promise<DocumentProcessingResult | null> {
    return this.prisma.$transaction(
      async (transaction) => {
        const [pending] = await transaction.$queryRaw<{ id: string }[]>(
          Prisma.sql`
          SELECT "id"
          FROM "Document"
          WHERE "status" = 'PROCESSING'::"DocumentStatus"
          ORDER BY "createdAt" ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        `,
        );

        if (!pending) {
          return null;
        }

        const document = await transaction.document.findUniqueOrThrow({
          where: { id: pending.id },
        });

        let content: string;
        try {
          content = await extractContent(document);
        } catch (error) {
          const failed = await transaction.document.update({
            where: { id: document.id },
            data: { status: 'ERROR' },
          });
          return {
            id: failed.id,
            status: 'ERROR',
            updatedAt: failed.updatedAt,
            error,
          };
        }

        const indexed = await transaction.document.update({
          where: { id: document.id },
          data: { content, status: 'INDEXED' },
        });
        return {
          id: indexed.id,
          status: 'INDEXED',
          updatedAt: indexed.updatedAt,
        };
      },
      { maxWait: 10_000, timeout: 300_000 },
    );
  }
}
