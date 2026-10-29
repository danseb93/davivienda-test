import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, Min, Max, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class ResponseWrapperDto<T = null> {
  @ApiProperty({
    description: "HTTP status code",
    type: Number,
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: "Indicates if the operation was successful",
    type: Boolean,
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "Response message",
    type: String,
    example: "Operation completed successfully",
  })
  message: string;

  @ApiPropertyOptional({
    description: "Response data payload",
  })
  @IsOptional()
  data?: T;
}

export class PaginationDto {
  @ApiProperty({
    description: "Page number for pagination",
    type: Number,
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Page must be an integer" })
  @Min(1, { message: "Page must be at least 1" })
  readonly page: number = 1;

  @ApiProperty({
    description: "Number of items per page",
    type: Number,
    example: 10,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Limit must be an integer" })
  @Min(1, { message: "Limit must be at least 1" })
  @Max(100, { message: "Limit must be at most 100" })
  readonly limit: number = 10;

  @ApiProperty({
    description: "Total number of records",
    type: Number,
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: "Total number of pages",
    type: Number,
    example: 10,
  })
  totalPages: number;
}

export class ResponseWrapperWithPaginationDto<
  T = null,
> extends ResponseWrapperDto<T> {
  @ApiProperty({
    description: "Pagination metadata",
    type: PaginationDto,
  })
  pagination: PaginationDto;
}
