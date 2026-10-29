import type {
  ApiDocument,
  ApiDocumentCounts,
  ApiDocumentPage,
  ApiPagination,
  ApiResponse,
  ApiSearchPage,
  DocumentStatusEvent,
  UploadMetadata,
} from '../interfaces/api.interface'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const apiUrl = `${apiBaseUrl}/api/v1`

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message
    throw new Error(message || `La solicitud falló (${response.status}).`)
  }

  return response.json() as Promise<T>
}

export async function listDocuments(query: {
  page: number
  limit: number
  search?: string
  status?: string
}): Promise<ApiDocumentPage> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  })
  if (query.search) params.set('search', query.search)
  if (query.status) params.set('status', query.status)
  const response = await request<
    ApiResponse<ApiDocument[]> & {
      pagination: ApiPagination
    }
  >(`/documents?${params}`)
  return { items: response.data, pagination: response.pagination }
}

export async function countDocuments(): Promise<ApiDocumentCounts> {
  const response = await request<ApiResponse<ApiDocumentCounts>>('/documents/count')
  return response.data
}

export async function getDocument(id: string) {
  const response = await request<ApiResponse<ApiDocument>>(`/documents/${encodeURIComponent(id)}`)
  return response.data
}

export async function updateDocument(id: string, data: Omit<UploadMetadata, 'tags'> & { tags: string[] }) {
  const response = await request<ApiResponse<ApiDocument>>(`/documents/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return response.data
}

export async function deleteDocument(id: string) {
  await request<ApiResponse<null>>(`/documents/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function searchDocuments(query: string, page = 1, limit = 10) {
  const params = new URLSearchParams({ q: query, page: String(page), limit: String(limit) })
  const response = await request<
    ApiResponse<ApiSearchPage['items']> & { pagination: ApiPagination }
  >(`/search?${params}`)
  return { items: response.data, pagination: response.pagination }
}

export function uploadDocument(file: File, metadata: UploadMetadata, onProgress: (progress: number) => void) {
  return new Promise<ApiDocument>((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', metadata.title)
    formData.append('author', metadata.author)
    formData.append('category', metadata.category)
    formData.append('version', metadata.version)
    formData.append('tags', metadata.tags)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${apiUrl}/documents`)
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    })
    xhr.addEventListener('load', () => {
      const body = parseResponse<ApiResponse<ApiDocument>>(xhr.responseText)
      if (xhr.status >= 200 && xhr.status < 300 && body?.data) {
        resolve(body.data)
        return
      }
      reject(new Error(getErrorMessage(body, xhr.status)))
    })
    xhr.addEventListener('error', () => reject(new Error('No fue posible conectar con el servidor.')))
    xhr.addEventListener('abort', () => reject(new Error('La carga fue cancelada.')))
    xhr.send(formData)
  })
}

export async function getOriginalFile(id: string, signal?: AbortSignal) {
  const response = await fetch(`${apiUrl}/documents/${encodeURIComponent(id)}/file`, {
    headers: { Accept: 'application/pdf, text/plain, text/markdown' },
    signal,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message
    throw new Error(message || `No se pudo abrir el documento (${response.status}).`)
  }

  return {
    blob: await response.blob(),
    contentType: response.headers.get('Content-Type')?.split(';')[0] ?? 'application/octet-stream',
    filename: decodeURIComponent(response.headers.get('X-Document-Name') ?? 'documento'),
  }
}

export function subscribeToDocuments(
  onStatus: (event: DocumentStatusEvent) => void,
  onError: () => void,
) {
  const source = new EventSource(`${apiUrl}/realtime/documents`)
  source.addEventListener('document.status', (event) => {
    try {
      onStatus(JSON.parse((event as MessageEvent<string>).data) as DocumentStatusEvent)
    } catch {
      onError()
    }
  })
  source.onerror = onError
  return source
}

function parseResponse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function getErrorMessage(body: ApiResponse<unknown> | null, status: number) {
  const message = (body as (ApiResponse<unknown> & { message?: string | string[] }) | null)?.message
  return (Array.isArray(message) ? message.join(', ') : message) || `La carga falló (${status}).`
}
