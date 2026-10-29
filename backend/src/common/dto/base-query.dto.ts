import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from './response-wrapper.dto.js';
import { SortOrder } from '../enums/sort.enum.js';

export class BaseQueryDto extends OmitType(PaginationDto, [
  'page',
  'limit',
  'total',
  'totalPages',
] as const) {
  @ApiProperty({ minimum: 1, default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number = 1;

  @ApiProperty({ minimum: 1, maximum: 100, default: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly limit?: number = 10;

  @ApiProperty({
    description: 'Search term to filter records',
    type: String,
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  @MaxLength(50)
  readonly search?: string;

  @ApiProperty({
    description: 'Field used to sort records',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly sort?: string;

  @ApiProperty({
    description: 'Sort order',
    enum: SortOrder,
    required: false,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'Order must be either asc or desc' })
  readonly order?: SortOrder = SortOrder.DESC;
}
