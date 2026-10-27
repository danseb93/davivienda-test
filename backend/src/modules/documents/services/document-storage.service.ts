import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';

const ACCEPTED_TYPES: Record<string, string[]> = {
  '.txt': ['text/plain', 'application/octet-stream'],
  '.md': [
    'text/markdown',
    'text/x-markdown',
    'text/plain',
    'application/octet-stream',
  ],
  '.pdf': ['application/pdf'],
};

@Injectable()
export class DocumentStorageService {
  private readonly logger = new Logger(DocumentStorageService.name);
  private readonly storageDirectory = resolve(
    process.cwd(),
    'uploads',
    'documents',
  );

  async store(file: Express.Multer.File): Promise<string> {
    const extension = extname(file.originalname).toLowerCase();
    const acceptedMimeTypes = ACCEPTED_TYPES[extension];

    if (!acceptedMimeTypes || !acceptedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only TXT, PDF, and Markdown documents are supported',
      );
    }

    if (file.originalname.length > 255) {
      throw new BadRequestException('The uploaded file name is too long');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('The uploaded file is empty');
    }

    if (
      extension === '.pdf' &&
      file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-'
    ) {
      throw new BadRequestException('The uploaded file is not a valid PDF');
    }

    if (extension !== '.pdf' && file.buffer.includes(0)) {
      throw new BadRequestException(
        'The uploaded text file contains binary data',
      );
    }

    const storageName = `${randomUUID()}${extension}`;
    await mkdir(this.storageDirectory, { recursive: true });
    await writeFile(this.resolveStoredFile(storageName), file.buffer, {
      flag: 'wx',
    });

    return storageName;
  }

  async remove(storageName: string): Promise<void> {
    try {
      await unlink(this.resolveStoredFile(storageName));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }

      this.logger.error(
        `Could not remove stored document file "${storageName}"`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'The document file could not be removed',
      );
    }
  }

  private resolveStoredFile(storageName: string): string {
    if (!storageName || basename(storageName) !== storageName) {
      throw new InternalServerErrorException('Invalid stored document path');
    }

    return join(this.storageDirectory, storageName);
  }
}
