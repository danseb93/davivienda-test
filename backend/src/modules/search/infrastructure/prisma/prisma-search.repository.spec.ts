import { PrismaService } from '../../../../prisma/prisma.service.js';
import { PrismaSearchRepository } from './prisma-search.repository.js';

describe('PrismaSearchRepository', () => {
  it('uses lexeme-prefix matching for ordinary word searches', async () => {
    const queryRaw = vi.fn().mockResolvedValue([]);
    const repository = new PrismaSearchRepository({
      $queryRaw: queryRaw,
    } as unknown as PrismaService);

    await repository.search({
      term: 'prue técn',
      page: 1,
      limit: 10,
    });

    const sql = queryRaw.mock.calls.map(([query]) => query);
    expect(sql[0].values).toContain('prue:* & técn:*');
    expect(sql[0].values).toContain('prue');
    expect(sql[0].strings.join(' ')).toContain("to_tsquery('simple'");
    expect(sql[0].strings.join(' ')).toContain('substring(');
    expect(sql[0].strings.join(' ')).toContain('strpos(lower(d."content")');
    expect(sql[0].strings.join(' ')).toContain('FOR 3000');
    expect(sql[0].strings.join(' ')).not.toContain('array_to_string(d."tags", \' \'), d."content"');
  });

  it('preserves websearch syntax for quoted exact phrases', async () => {
    const queryRaw = vi.fn().mockResolvedValue([]);
    const repository = new PrismaSearchRepository({
      $queryRaw: queryRaw,
    } as unknown as PrismaService);

    await repository.search({
      term: '"prueba técnica"',
      page: 1,
      limit: 10,
    });

    const sql = queryRaw.mock.calls.map(([query]) => query);
    expect(sql[0].values).toContain('"prueba técnica"');
    expect(sql[0].values).toContain('prueba');
    expect(sql[0].strings.join(' ')).toContain("websearch_to_tsquery('simple'");
  });

  it('preserves websearch operators', async () => {
    const queryRaw = vi.fn().mockResolvedValue([]);
    const repository = new PrismaSearchRepository({
      $queryRaw: queryRaw,
    } as unknown as PrismaService);

    await repository.search({
      term: 'prueba OR técnica',
      page: 1,
      limit: 10,
    });

    const sql = queryRaw.mock.calls.map(([query]) => query);
    expect(sql[0].values).toContain('prueba OR técnica');
    expect(sql[0].strings.join(' ')).toContain("websearch_to_tsquery('simple'");
  });
});
