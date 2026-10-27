import { Document } from './document.entity.js';

export type CreateDocumentData = Pick<
  Document,
  | 'title'
  | 'author'
  | 'category'
  | 'tags'
  | 'version'
  | 'fileName'
  | 'storageName'
  | 'mimeType'
  | 'fileSize'
  | 'status'
>;

export type UpdateDocumentData = Partial<
  Pick<Document, 'title' | 'author' | 'category' | 'tags' | 'version'>
>;

export interface DocumentRepository {
  findAll(): Promise<Document[]>;
  findById(id: string): Promise<Document | null>;
  create(data: CreateDocumentData): Promise<Document>;
  update(id: string, data: UpdateDocumentData): Promise<Document>;
  delete(id: string): Promise<Document>;
}
