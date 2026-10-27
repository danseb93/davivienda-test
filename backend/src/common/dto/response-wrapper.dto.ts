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
