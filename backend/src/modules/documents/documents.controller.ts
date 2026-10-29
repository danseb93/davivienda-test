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
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
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
  DocumentCountsResponseDto,
  DeleteDocumentResponseDto,
  DocumentQueryDto,
  DocumentResponseDto,
  DocumentsResponseDto,
  UpdateDocumentDto,
} from './dto/document.dto.js';
import { DocumentCreatorService } from './services/document-creator.service.js';
import { DocumentFinderService } from './services/document-finder.service.js';
import { DocumentRemoverService } from './services/document-remover.service.js';
import { DocumentUpdaterService } from './services/document-updater.service.js';
import { DocumentStorageService } from './services/document-storage.service.js';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentFinder: DocumentFinderService,
    private readonly documentCreator: DocumentCreatorService,
    private readonly documentUpdater: DocumentUpdaterService,
    private readonly documentRemover: DocumentRemoverService,
    private readonly documentStorage: DocumentStorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all documents and their metadata' })
  @ApiOkResponse({ type: DocumentsResponseDto })
  async findAll(
    @Query() query: DocumentQueryDto,
  ): Promise<DocumentsResponseDto> {
    const result = await this.documentFinder.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Documents retrieved successfully',
      data: result.documents,
      pagination: result.pagination,
    };
  }

  @Get('count')
  @ApiOperation({ summary: 'Get document counts by processing status' })
  @ApiOkResponse({ type: DocumentCountsResponseDto })
  async findCounts(): Promise<DocumentCountsResponseDto> {
    const data = await this.documentFinder.findCounts();
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Document counts retrieved successfully',
      data,
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

  @Get(':id/file')
  @ApiOperation({ summary: 'Stream the original document file for preview' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async getOriginalFile(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const document = await this.documentFinder.findById(id);
    const file = await this.documentStorage.read(document.storageName);
    const encodedFileName = encodeURIComponent(document.fileName).replace(
      /[!'()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );

    response.setHeader('Content-Type', document.mimeType);
    response.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodedFileName}`,
    );
    response.setHeader(
      'Access-Control-Expose-Headers',
      'Content-Disposition, X-Document-Name',
    );
    response.setHeader('X-Document-Name', encodedFileName);
    response.setHeader('Cache-Control', 'private, no-store');

    return new StreamableFile(file);
  }

  @Get(':id/preview')
  @ApiOperation({
    summary: 'Stream the searchable PDF preview or the original document',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  async getPreviewFile(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const document = await this.documentFinder.findById(id);
    const file = await this.documentStorage.readPreview(document.storageName);
    const encodedFileName = encodeURIComponent(document.fileName).replace(
      /[!'()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );

    response.setHeader('Content-Type', document.mimeType);
    response.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodedFileName}`,
    );
    response.setHeader(
      'Access-Control-Expose-Headers',
      'Content-Disposition, X-Document-Name',
    );
    response.setHeader('X-Document-Name', encodedFileName);
    response.setHeader('Cache-Control', 'private, no-store');

    return new StreamableFile(file);
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
