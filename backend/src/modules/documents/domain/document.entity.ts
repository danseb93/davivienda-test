import type { DocumentStatus } from '../../../common/enums/document-status.enum.js';

export type { DocumentStatus } from '../../../common/enums/document-status.enum.js';

export class Document {
  id!: string;
  title!: string;
  author!: string;
  category!: string;
  tags!: string[];
  version!: string;
  content!: string;
  fileName!: string;
  storageName!: string;
  mimeType!: string;
  fileSize!: number;
  status!: DocumentStatus;
  createdAt!: Date;
  updatedAt!: Date;
}
