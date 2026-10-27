import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchQueryDto, SearchResponseDto } from './dto/search.dto.js';
import { DocumentSearchService } from './services/document-search.service.js';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly documentSearch: DocumentSearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Search documents across titles, metadata, and content',
  })
  @ApiOkResponse({ type: SearchResponseDto })
  async search(@Query() query: SearchQueryDto): Promise<SearchResponseDto> {
    const data = await this.documentSearch.search(query);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Search completed successfully',
      data,
    };
  }
}
