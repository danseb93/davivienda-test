import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { PrismaSearchRepository } from './infrastructure/prisma/prisma-search.repository.js';
import { SearchController } from './search.controller.js';
import { DocumentSearchService } from './services/document-search.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [SearchController],
  providers: [
    DocumentSearchService,
    {
      provide: 'SearchRepository',
      useClass: PrismaSearchRepository,
    },
  ],
})
export class SearchModule {}
