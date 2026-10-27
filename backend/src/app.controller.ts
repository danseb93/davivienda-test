import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseWrapperDto } from './common/dto/response-wrapper.dto.js';

@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: "Get API status" })
  @ApiResponse({
    status: 200,
    description: "Returns API status",
    type: ResponseWrapperDto,
  })
  getStatus(): ResponseWrapperDto {
    return {
      success: true,
      message: "Davivienda Test is running!",
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
