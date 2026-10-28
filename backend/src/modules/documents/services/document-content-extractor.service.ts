import { Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class DocumentContentExtractorService {
  async extract(content: Buffer, mimeType: string): Promise<string> {
    if (mimeType !== 'application/pdf') {
      return content.toString('utf8');
    }

    const parser = new PDFParse({ data: content });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }
}
