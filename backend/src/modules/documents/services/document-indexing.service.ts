import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { inspect } from 'node:util';
import type { DocumentRepository } from '../domain/document.repository.js';
import { DocumentContentExtractorService } from './document-content-extractor.service.js';
import { DocumentStorageService } from './document-storage.service.js';
import { RealtimeEventService } from '../../realtime/services/realtime-event.service.js';

@Injectable()
export class DocumentIndexingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DocumentIndexingService.name);
  private stopped = false;
  private timer?: NodeJS.Timeout;
  private currentRun?: Promise<void>;

  constructor(
    @Inject('DocumentRepository')
    private readonly documentRepository: DocumentRepository,
    private readonly documentStorage: DocumentStorageService,
    private readonly contentExtractor: DocumentContentExtractorService,
    private readonly realtimeEvents: RealtimeEventService,
  ) {}

  onModuleInit(): void {
    this.schedule(0);
  }

  async onModuleDestroy(): Promise<void> {
    this.stopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    await this.currentRun;
  }

  private schedule(delay: number): void {
    this.timer = setTimeout(() => {
      this.currentRun = this.processPendingDocuments().finally(() => {
        this.currentRun = undefined;
        if (!this.stopped) {
          this.schedule(1_000);
        }
      });
    }, delay);
  }

  private async processPendingDocuments(): Promise<void> {
    try {
      while (!this.stopped) {
        const result = await this.documentRepository.processNextPending(
          async (document) => {
            const file = await this.documentStorage.read(document.storageName);
            return this.contentExtractor.extract(file, document.mimeType);
          },
        );

        if (!result) {
          return;
        }

        if (result.error) {
          this.logger.error(
            `Document "${result.id}" could not be indexed`,
            result.error instanceof Error
              ? result.error.stack
              : inspect(result.error),
          );
        }

        this.realtimeEvents.publish({
          id: result.id,
          status: result.status,
          updatedAt: result.updatedAt,
        });
      }
    } catch (error) {
      this.logger.error(
        'The document indexing worker failed to process a pending document',
        error instanceof Error ? error.stack : inspect(error),
      );
    }
  }
}
