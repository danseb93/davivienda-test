import { BadRequestException } from '@nestjs/common';
import { SearchRepository } from '../domain/search.repository.js';
import { DocumentSearchService } from './document-search.service.js';

describe('DocumentSearchService', () => {
  it('returns paginated, escaped results with highlighted matches', async () => {
    const search = vi.fn().mockResolvedValue({
      items: [
        {
          id: 'ad0d232a-f65b-4aeb-b4a5-1bc188c1d097',
          title: 'Motor guide',
          author: 'Engineering',
          category: 'Manuals',
          tags: ['motor'],
          version: '1.0',
          snippet: 'Guide <script> MOTOR ZXQSTARTZXQengineZXQENDZXQ',
          rank: 0.75,
        },
      ],
      total: 3,
    });
    const repository: SearchRepository = { search };
    const service = new DocumentSearchService(repository);

    await expect(
      service.search({ q: ' motor ', page: 2, limit: 1 }),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          snippet: 'Guide &lt;script&gt; MOTOR <mark>engine</mark>',
        }),
      ],
      pagination: {
        page: 2,
        limit: 1,
        total: 3,
        totalPages: 3,
      },
    });
    expect(search).toHaveBeenCalledWith({
      term: 'motor',
      page: 2,
      limit: 1,
    });
  });

  it('rejects a blank query', async () => {
    const search = vi.fn();
    const repository: SearchRepository = { search };
    const service = new DocumentSearchService(repository);

    await expect(service.search({ q: '   ' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(search).not.toHaveBeenCalled();
  });
});
