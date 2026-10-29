import { SearchController } from './search.controller.js';
import { SearchQueryDto } from './dto/search.dto.js';
import { DocumentSearchService } from './services/document-search.service.js';

describe('SearchController', () => {
  it('returns search results with the standard response wrapper', async () => {
    const query: SearchQueryDto = { q: 'motor', page: 2, limit: 5 };
    const searchResult = {
      items: [
        {
          id: 'ad0d232a-f65b-4aeb-b4a5-1bc188c1d097',
          title: 'Motor guide',
          author: 'Engineering',
          category: 'Manuals',
          tags: ['motor'],
          version: '1.0',
          snippet: 'Guide with a <mark>motor</mark>',
          rank: 0.75,
        },
      ],
      pagination: {
        page: 2,
        limit: 5,
        total: 6,
        totalPages: 2,
      },
    };
    const search = vi.fn().mockResolvedValue(searchResult);
    const controller = new SearchController({
      search,
    } as unknown as DocumentSearchService);

    await expect(controller.search(query)).resolves.toEqual({
      statusCode: 200,
      success: true,
      message: 'Search completed successfully',
      data: searchResult.items,
      pagination: searchResult.pagination,
    });
    expect(search).toHaveBeenCalledWith(query);
  });
});
