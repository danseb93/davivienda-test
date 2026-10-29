import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto.js';
import {
  ResponseWrapperDto,
  ResponseWrapperWithPaginationDto,
} from '../../../common/dto/response-wrapper.dto.js';
import type { DocumentStatus } from '../domain/document.entity.js';

function transformTags(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Si no es un JSON válido, continúa para evaluarlo como texto separado por comas
  }

  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

// 1. Clase base con las propiedades compartidas
export class BaseDocumentDto {
  @ApiProperty({ example: 'Manual de mantenimiento', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Equipo de ingeniería', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  author!: string;

  @ApiProperty({ example: 'Manuales', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['mantenimiento', 'motor'],
    description: 'Tags como arreglo JSON o separados por comas en multipart.',
  })
  @IsOptional()
  @Transform(({ value }) => transformTags(value))
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: '1.0', maxLength: 40 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  version!: string;
}

// 2. DTO de Creación (Hereda los campos y añade el archivo para Swagger/Multer)
export class CreateDocumentDto extends BaseDocumentDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Archivo del documento (TXT, PDF o Markdown)',
  })
  @IsOptional()
  file?: any;
}

// 3. DTO de Actualización (Vuelve opcionales todas las propiedades de creación)
export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {}

export class DocumentQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    enum: ['PROCESSING', 'INDEXED', 'ERROR'],
    description: 'Filter documents by processing status',
  })
  @IsOptional()
  @IsIn(['PROCESSING', 'INDEXED', 'ERROR'])
  declare readonly status?: DocumentStatus;

  @ApiPropertyOptional({
    enum: ['createdAt', 'updatedAt', 'title'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'title'])
  declare readonly sort?: 'createdAt' | 'updatedAt' | 'title';
}

// 4. DTO de Respuesta del Documento (Hereda los metadatos y añade los campos generados por el sistema)
export class DocumentDto extends BaseDocumentDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'manual.pdf' })
  fileName!: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({ example: 24576 })
  fileSize!: number;

  @ApiProperty({ enum: ['PROCESSING', 'INDEXED', 'ERROR'] })
  status!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class DocumentResponseDto extends ResponseWrapperDto<DocumentDto> {
  @ApiProperty({ type: DocumentDto })
  declare data: DocumentDto;
}

export class DocumentsResponseDto extends ResponseWrapperWithPaginationDto<DocumentDto[]> {
  @ApiProperty({ type: DocumentDto, isArray: true })
  declare data: DocumentDto[];
}

export class DocumentCountsDto {
  @ApiProperty({ example: 25 })
  total!: number;

  @ApiProperty({ example: 20 })
  indexed!: number;

  @ApiProperty({ example: 3 })
  processing!: number;

  @ApiProperty({ example: 2 })
  error!: number;
}

export class DocumentCountsResponseDto extends ResponseWrapperDto<DocumentCountsDto> {
  @ApiProperty({ type: DocumentCountsDto })
  declare data: DocumentCountsDto;
}

export class DocumentCountQueryDto {
  @ApiPropertyOptional({
    description: 'Search term to filter counts by document metadata',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  readonly search?: string;
}

export class DeleteDocumentResponseDto extends ResponseWrapperDto {}