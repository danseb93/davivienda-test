import { BadRequestException } from '@nestjs/common';
import { DocumentStorageService } from './document-storage.service.js';

describe('DocumentStorageService', () => {
  const storage = new DocumentStorageService();

  it.each([
    ['guide.txt', 'text/plain', Buffer.from('Plain text')],
    ['guide.pdf', 'application/pdf', Buffer.from('%PDF-1.7')],
    ['guide.md', 'text/markdown', Buffer.from('# Markdown')],
    ['guide.markdown', 'text/markdown', Buffer.from('# Markdown')],
  ])('stores an allowed format: %s', async (name, mimetype, buffer) => {
    const storageName = await storage.store({
      originalname: name,
      mimetype,
      buffer,
    } as Express.Multer.File);

    expect(storageName.endsWith(name.slice(name.lastIndexOf('.')).toLowerCase())).toBe(true);
    await storage.remove(storageName);
  });

  it.each([
    ['guide.docx', 'application/octet-stream'],
    ['guide.md', 'application/msword'],
  ])('rejects unsupported formats or MIME types: %s', async (name, mimetype) => {
    await expect(
      storage.store({
        originalname: name,
        mimetype,
        buffer: Buffer.from('content'),
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
