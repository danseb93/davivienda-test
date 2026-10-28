import { DocumentContentExtractorService } from './document-content-extractor.service.js';

describe('DocumentContentExtractorService', () => {
  it('decodes TXT and Markdown content as UTF-8', async () => {
    const service = new DocumentContentExtractorService();

    await expect(
      service.extract(Buffer.from('Guía de mantenimiento'), 'text/markdown'),
    ).resolves.toBe('Guía de mantenimiento');
  });
});
