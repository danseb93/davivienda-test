import type { DocumentStatus } from '../../documents/domain/document.entity.js';

export interface DocumentStatusEvent {
  id: string;
  status: DocumentStatus;
  updatedAt: Date;
}
