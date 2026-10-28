import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { DocumentsController } from './documents.controller.js';
import { PrismaDocumentRepository } from './infrastructure/prisma/prisma-document.repository.js';
import { DocumentCreatorService } from './services/document-creator.service.js';
import { DocumentFinderService } from './services/document-finder.service.js';
import { DocumentRemoverService } from './services/document-remover.service.js';
import { DocumentStorageService } from './services/document-storage.service.js';
import { DocumentUpdaterService } from './services/document-updater.service.js';
import { DocumentContentExtractorService } from './services/document-content-extractor.service.js';
import { DocumentIndexingService } from './services/document-indexing.service.js';
import { RealtimeModule } from '../realtime/realtime.module.js';

@Module({
  imports: [
    PrismaModule,
    RealtimeModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const maxFileSizeMb = Number(
          config.get<string>('MAX_FILE_SIZE_MB') ?? '25',
        );
        if (!Number.isFinite(maxFileSizeMb) || maxFileSizeMb <= 0) {
          throw new Error('MAX_FILE_SIZE_MB must be a positive number');
        }

        return {
          storage: memoryStorage(),
          limits: { fileSize: maxFileSizeMb * 1024 * 1024 },
        };
      },
    }),
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentFinderService,
    DocumentCreatorService,
    DocumentUpdaterService,
    DocumentRemoverService,
    DocumentStorageService,
    DocumentContentExtractorService,
    DocumentIndexingService,
    {
      provide: 'DocumentRepository',
      useClass: PrismaDocumentRepository,
    },
  ],
})
export class DocumentsModule {}
