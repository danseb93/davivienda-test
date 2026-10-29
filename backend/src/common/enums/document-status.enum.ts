export const DocumentStatus = {
  PROCESSING: 'PROCESSING',
  INDEXED: 'INDEXED',
  ERROR: 'ERROR',
} as const;

export type DocumentStatus =
  (typeof DocumentStatus)[keyof typeof DocumentStatus];
