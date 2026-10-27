import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { SearchRepository } from '../domain/search.repository.js';
import { SearchQueryDto, SearchResultDto } from '../dto/search.dto.js';

const START_MARKER = 'ZXQSTARTZXQ';
const END_MARKER = 'ZXQENDZXQ';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatSnippet(snippet: string): string {
  return snippet
    .split(new RegExp(`(${START_MARKER}|${END_MARKER})`))
    .map((part) => {
      if (part === START_MARKER) {
        return '<mark>';
      }
      if (part === END_MARKER) {
        return '</mark>';
      }
      return escapeHtml(part);
    })
    .join('');
}

@Injectable()
export class DocumentSearchService {
  constructor(
    @Inject('SearchRepository')
    private readonly searchRepository: SearchRepository,
  ) {}

  async search(query: SearchQueryDto): Promise<{
    items: SearchResultDto[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const searchTerm = query.q.trim();
    if (!searchTerm) {
      throw new BadRequestException('Search query must not be empty');
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { items, total } = await this.searchRepository.search({
      term: searchTerm,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return {
      items: items.map((row) => ({
        ...row,
        snippet: formatSnippet(row.snippet),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
