import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import {
  SearchDocumentsQuery,
  SearchRepository,
  SearchDocumentsResult,
} from '../../domain/search.repository.js';

interface SearchRow {
  id: string;
  title: string;
  author: string;
  category: string;
  tags: string[];
  version: string;
  snippet: string;
  rank: number;
}

interface CountRow {
  total: bigint;
}

const START_MARKER = 'ZXQSTARTZXQ';
const END_MARKER = 'ZXQENDZXQ';

@Injectable()
export class PrismaSearchRepository implements SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchDocumentsQuery): Promise<SearchDocumentsResult> {
    const plainTerms = query.term.match(/[\p{L}\p{N}_]+/gu) ?? [];
    const snippetAnchor =
      plainTerms.find((term) => !/^(?:AND|OR|NOT)$/i.test(term)) ?? '';
    const isPlainPrefixSearch =
      plainTerms.length > 0 &&
      /^[\p{L}\p{N}_\s]+$/u.test(query.term) &&
      !/\b(?:AND|OR|NOT)\b/.test(query.term);
    const tsQuery = isPlainPrefixSearch
      ? Prisma.sql`to_tsquery('simple', ${plainTerms.map((term) => `${term}:*`).join(' & ')})`
      : Prisma.sql`websearch_to_tsquery('simple', ${query.term})`;
    const [items, countRows] = await Promise.all([
      this.prisma.$queryRaw<SearchRow[]>(Prisma.sql`
        SELECT
          d."id",
          d."title",
          d."author",
          d."category",
          d."tags",
          d."version",
          ts_headline(
            'simple',
            concat_ws(
              ' ',
              d."title",
              d."author",
              d."category",
              array_to_string(d."tags", ' '),
              substring(
                d."content"
                FROM CASE
                  WHEN ${snippetAnchor} = '' THEN 1
                  ELSE greatest(
                    1,
                    strpos(lower(d."content"), lower(${snippetAnchor})) - 1500
                  )
                END
                FOR 3000
              )
            ),
            ${tsQuery},
            'StartSel=${Prisma.raw(START_MARKER)}, StopSel=${Prisma.raw(END_MARKER)}, MaxFragments=2, MinWords=8, MaxWords=24'
          ) AS "snippet",
          ts_rank_cd(d."searchVector", ${tsQuery}) AS "rank"
        FROM "Document" AS d
        WHERE d."status" = 'INDEXED'::"DocumentStatus"
          AND d."searchVector" @@ ${tsQuery}
        ORDER BY "rank" DESC, d."createdAt" DESC
        LIMIT ${query.limit}
        OFFSET ${(query.page - 1) * query.limit}
      `),
      this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT count(*) AS "total"
        FROM "Document" AS d
        WHERE d."status" = 'INDEXED'::"DocumentStatus"
          AND d."searchVector" @@ ${tsQuery}
      `),
    ]);

    return {
      items,
      total: Number(countRows[0]?.total ?? 0n),
    };
  }
}
