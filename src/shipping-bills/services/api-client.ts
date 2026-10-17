const BASE_URL = import.meta.env.VITE_BASE_URL || import.meta.env.PUBLIC_API_URL || 'http://192.168.1.123:3408'

const DEFAULT_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: 'tenantId=1000&user=1000&role=1'
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: unknown
}

export async function apiRequest(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: options.headers ?? DEFAULT_HEADERS,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  })
  if (!response.ok) throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  return response
}

export const apiBaseUrl = BASE_URL
