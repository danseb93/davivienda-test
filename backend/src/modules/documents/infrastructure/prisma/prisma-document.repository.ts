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
import type { Pagination } from '../../../../common/domain/pagination.entity.js';
import type {
  DocumentCounts,
  PaginatedDocuments,
} from '../../domain/document.repository.js';

function createSearchConditions(search?: string): Prisma.DocumentWhereInput {
  return search
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
          { version: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ],
      }
    : {};
}

@Injectable()
export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: Pagination,
    status?: Document['status'],
  ): Promise<PaginatedDocuments> {
    const searchConditions = createSearchConditions(query.search);
    const where: Prisma.DocumentWhereInput = {
      ...searchConditions,
      ...(status ? { status } : {}),
    };
    const orderBy: Prisma.DocumentOrderByWithRelationInput = {
      [query.sort]: query.order,
    };
    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        select: {
          id: true,
          title: true,
          author: true,
          category: true,
          tags: true,
          version: true,
          fileName: true,
          mimeType: true,
          fileSize: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return { items, total };
  }

  async findCounts(search?: string): Promise<DocumentCounts> {
    const statusCounts = await this.prisma.document.groupBy({
      by: ['status'],
      where: createSearchConditions(search),
      _count: { _all: true },
    });
    const counts: DocumentCounts = {
      total: 0,
      indexed: 0,
      processing: 0,
      error: 0,
    };
    for (const entry of statusCounts) {
      const count = entry._count._all;
      counts.total += count;
      if (entry.status === 'INDEXED') counts.indexed = count;
      if (entry.status === 'PROCESSING') counts.processing = count;
      if (entry.status === 'ERROR') counts.error = count;
    }

    return counts;
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
            title: failed.title,
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
          title: indexed.title,
          status: 'INDEXED',
          updatedAt: indexed.updatedAt,
        };
      },
      { maxWait: 10_000, timeout: 300_000 },
    );
  }
}
