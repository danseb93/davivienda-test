import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import {
  CreateDocumentData,
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
}
