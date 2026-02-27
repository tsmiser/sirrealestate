// Zero React dependencies — portable as-is to any JS environment.
import { fetchAuthSession } from 'aws-amplify/auth'
import type { ChatRequest, ChatResponse } from '@/types'

const API_URL = import.meta.env.VITE_API_URL

async function getAuthHeader(): Promise<Record<string, string>> {
  const session = await fetchAuthSession()
  const token = session.tokens?.idToken?.toString()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const authHeader = await getAuthHeader()
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}

export const chat = {
  send: (req: ChatRequest) => api.post<ChatResponse>('/chat', req),
}
