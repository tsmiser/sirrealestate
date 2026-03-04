import { fetchAuthSession } from 'aws-amplify/auth'

const BASE_URL = import.meta.env.VITE_API_URL as string

async function getToken(): Promise<string> {
  const session = await fetchAuthSession()
  const token = session.tokens?.idToken?.toString()
  if (!token) throw new Error('Not authenticated')
  return token
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`API ${method} ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

const get = <T>(path: string) => request<T>('GET', path)
const patch = <T>(path: string, body: unknown) => request<T>('PATCH', path, body)

export interface DashboardCounts {
  users: number
  profiles: number
  searches: number
  documents: number
  viewings: number
  offers: number
}

export interface AdminUser {
  userId: string
  email: string
  emailVerified: boolean
  status: string
  enabled: boolean
  createdAt: string
  profile: Record<string, unknown> | null
}

export const api = {
  dashboard: {
    get: () => get<{ counts: DashboardCounts }>('/dashboard'),
  },
  users: {
    list: (nextToken?: string) =>
      get<{ users: AdminUser[]; nextToken: string | null }>(
        `/users${nextToken ? `?nextToken=${encodeURIComponent(nextToken)}` : ''}`,
      ),
    setEnabled: (username: string, enabled: boolean) =>
      patch<{ ok: boolean }>('/users', { username, enabled }),
  },
  searches: {
    list: () => get<{ searches: Record<string, unknown>[] }>('/searches'),
  },
  documents: {
    list: () => get<{ documents: Record<string, unknown>[] }>('/documents'),
  },
  viewings: {
    list: () => get<{ viewings: Record<string, unknown>[] }>('/viewings'),
  },
  offers: {
    list: () => get<{ offers: Record<string, unknown>[] }>('/offers'),
  },
}
