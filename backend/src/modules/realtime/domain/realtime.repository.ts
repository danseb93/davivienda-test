import { DocumentStatusEvent } from './document-status-event.js';

export interface RealtimeRepository {
  findDocumentStatus(id: string): Promise<DocumentStatusEvent | null>;
}
