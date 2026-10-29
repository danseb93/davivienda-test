const configuredMaxBatchFiles = Number(
  import.meta.env.VITE_MAX_DOCUMENTS_PER_BATCH ?? 20,
)

if (!Number.isSafeInteger(configuredMaxBatchFiles) || configuredMaxBatchFiles < 1) {
  throw new Error('VITE_MAX_DOCUMENTS_PER_BATCH debe ser un entero positivo.')
}

export const maxBatchFiles = configuredMaxBatchFiles

const configuredUploadConcurrency = Number(
  import.meta.env.VITE_UPLOAD_CONCURRENCY ?? 5,
)

if (!Number.isSafeInteger(configuredUploadConcurrency) || configuredUploadConcurrency < 1) {
  throw new Error('VITE_UPLOAD_CONCURRENCY debe ser un entero positivo.')
}

export const uploadConcurrency = configuredUploadConcurrency
