import { EventEmitter } from 'node:events';
import { access, writeFile } from 'node:fs/promises';
import type { ConfigService } from '@nestjs/config';

const { spawnMock } = vi.hoisted(() => ({ spawnMock: vi.fn() }));

vi.mock('node:child_process', () => ({ spawn: spawnMock }));

import { SearchablePdfService } from './searchable-pdf.service.js';

describe('SearchablePdfService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates a searchable PDF with the configured OCR languages and removes temporary files', async () => {
    const child = new EventEmitter();
    Object.assign(child, { stderr: new EventEmitter(), kill: vi.fn() });
    const searchablePdf = Buffer.from('%PDF-searchable');
    let outputPath = '';
    spawnMock.mockImplementation(
      (_command: string, args: string[]) => {
        outputPath = args[args.length - 1];
        setImmediate(() => {
          void writeFile(outputPath, searchablePdf).then(() => {
            child.emit('close', 0);
          });
        });
        return child;
      },
    );
    const config = {
      get: (key: string) =>
        key === 'OCR_LANGUAGES' ? 'spa+eng' : '5',
    } as ConfigService;
    const service = new SearchablePdfService(config);

    await expect(service.makeSearchable(Buffer.from('%PDF-original'))).resolves.toEqual(
      searchablePdf,
    );

    const [command, argumentsList] = spawnMock.mock.calls[0] as [
      string,
      string[],
    ];
    expect(command).toBe('ocrmypdf');
    expect(argumentsList).toEqual([
      '--skip-text',
      '--language',
      'spa+eng',
      '--output-type',
      'pdf',
      '--optimize',
      '0',
      expect.stringMatching(/original\.pdf$/),
      expect.stringMatching(/searchable\.pdf$/),
    ]);
    await expect(access(outputPath)).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
