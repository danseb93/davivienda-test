import { OmitType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto.js';
import { ResponseWrapperWithPaginationDto } from '../../../common/dto/response-wrapper.dto.js';

export class SearchQueryDto extends OmitType(BaseQueryDto, [
  'search',
  'sort',
  'order',
] as const) {
  @ApiProperty({
    description:
      'Keywords or a phrase. Use double quotes to search for an exact phrase.',
    example: '"motor de combustión"',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  q!: string;

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

export class SearchResponseDto extends ResponseWrapperWithPaginationDto<
  SearchResultDto[]
> {
  @ApiProperty({ type: SearchResultDto, isArray: true })
  declare data: SearchResultDto[];
}
