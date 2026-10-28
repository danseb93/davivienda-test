import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CreateDocumentDto,
  DeleteDocumentResponseDto,
  DocumentResponseDto,
  DocumentsResponseDto,
  UpdateDocumentDto,
} from './dto/document.dto.js';
import { DocumentCreatorService } from './services/document-creator.service.js';
import { DocumentFinderService } from './services/document-finder.service.js';
import { DocumentRemoverService } from './services/document-remover.service.js';
import { DocumentUpdaterService } from './services/document-updater.service.js';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentFinder: DocumentFinderService,
    private readonly documentCreator: DocumentCreatorService,
    private readonly documentUpdater: DocumentUpdaterService,
    private readonly documentRemover: DocumentRemoverService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all documents and their metadata' })
  @ApiOkResponse({ type: DocumentsResponseDto })
  async findAll(): Promise<DocumentsResponseDto> {
    const documents = await this.documentFinder.findAll();
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Documents retrieved successfully',
      data: documents.map(
        ({ storageName: _storageName, content: _content, ...document }) =>
          document,
      ),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiOkResponse({ type: DocumentResponseDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<DocumentResponseDto> {
    const { storageName: _storageName, content: _content, ...data } =
      await this.documentFinder.findById(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Document retrieved successfully',
      data,
    };
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document with its metadata' })
  @ApiCreatedResponse({ type: DocumentResponseDto })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateDocumentDto })
  async create(
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<DocumentResponseDto> {
    const { storageName: _storageName, content: _content, ...data } =
      await this.documentCreator.create(dto, file);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Document uploaded successfully',
      data,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiOkResponse({ type: DocumentResponseDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<DocumentResponseDto> {
    const { storageName: _storageName, content: _content, ...data } =
      await this.documentUpdater.update(id, dto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Document updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document and its stored file' })
  @ApiOkResponse({ type: DeleteDocumentResponseDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<DeleteDocumentResponseDto> {
    await this.documentRemover.remove(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Document deleted successfully',
    };
  }
}
