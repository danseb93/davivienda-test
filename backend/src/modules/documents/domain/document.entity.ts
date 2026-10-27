export type DocumentStatus = 'PROCESSING' | 'INDEXED' | 'ERROR';

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
