import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

@Injectable()
export class SearchablePdfService {
  private readonly languages: string;
  private readonly timeoutMs: number;

  constructor(config: ConfigService) {
    this.languages = config.get<string>('OCR_LANGUAGES') ?? 'spa+eng';
    const timeoutSeconds = Number(
      config.get<string>('OCR_TIMEOUT_SECONDS') ?? '600',
    );
    if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) {
      throw new Error('OCR_TIMEOUT_SECONDS must be a positive number');
    }
    this.timeoutMs = timeoutSeconds * 1_000;
  }

  async makeSearchable(pdf: Buffer): Promise<Buffer> {
    const directory = await mkdtemp(join(tmpdir(), 'document-ocr-'));
    const inputPath = join(directory, 'original.pdf');
    const outputPath = join(directory, 'searchable.pdf');

    try {
      await writeFile(inputPath, pdf);
      await this.runOcr(inputPath, outputPath);
      const searchablePdf = await readFile(outputPath);
      if (searchablePdf.subarray(0, 5).toString('ascii') !== '%PDF-') {
        throw new Error('OCRmyPDF did not produce a valid searchable PDF');
      }
      return searchablePdf;
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  private runOcr(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(
        'ocrmypdf',
        [
          '--skip-text',
          '--language',
          this.languages,
          '--output-type',
          'pdf',
          '--optimize',
          '0',
          inputPath,
          outputPath,
        ],
        { stdio: ['ignore', 'ignore', 'pipe'] },
      );
      let stderr = '';
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (error) reject(error);
        else resolve();
      };
      const timeout = setTimeout(() => {
        process.kill('SIGKILL');
        finish(
          new Error(`PDF OCR exceeded the ${this.timeoutMs / 1_000}s timeout`),
        );
      }, this.timeoutMs);

      process.stderr?.on('data', (chunk: Buffer) => {
        stderr = `${stderr}${chunk.toString()}`.slice(-8_192);
      });
      process.on('error', (error) => {
        finish(new Error(`Could not start OCRmyPDF: ${error.message}`));
      });
      process.on('close', (code) => {
        if (code === 0) {
          finish();
          return;
        }
        finish(
          new Error(
            `PDF OCR failed with exit code ${code}${stderr ? `: ${stderr.trim()}` : ''}`,
          ),
        );
      });
    });
  }
}
