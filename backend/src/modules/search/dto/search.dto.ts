import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ResponseWrapperDto } from '../../../common/dto/response-wrapper.dto.js';

export class SearchQueryDto {
  @ApiProperty({
    description:
      'Keywords or a phrase. Use double quotes to search for an exact phrase.',
    example: '"motor de combustión"',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  q!: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class SearchResultDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  author!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty()
  version!: string;

  @ApiProperty({
    description:
      'Matching text fragment. Matching terms are wrapped in <mark>.',
  })
  snippet!: string;

  @ApiProperty({ description: 'Full-text relevance score' })
  rank!: number;
}

export class SearchResultsPageDto {
  @ApiProperty({ type: [SearchResultDto] })
  items!: SearchResultDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  totalPages!: number;
}

export class SearchResponseDto extends ResponseWrapperDto<SearchResultsPageDto> {
  @ApiProperty({ type: SearchResultsPageDto })
  declare data: SearchResultsPageDto;
}
