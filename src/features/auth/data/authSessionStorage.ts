/**
 * @file Auth session storage helpers.
 */
import type { JsonStorage } from '../../../infrastructure/storage/jsonStorage'

/**
 * Storage key for auth session data.
 */
export const AUTH_SESSION_STORAGE_KEY = 'auth.session'

export type AuthSession = {
  token: string
}

export type AuthSessionStorage = {
  getToken(): string | null
  setToken(token: string): void
  clear(): void
}

/**
 * Create auth session storage wrapper.
 * @param storage JSON storage adapter
 * @returns auth session storage
 */
export function createAuthSessionStorage(storage: JsonStorage): AuthSessionStorage {
  return {
    getToken(): string | null {
      const session = storage.get<AuthSession>(AUTH_SESSION_STORAGE_KEY)
      return session?.token ?? null
    },
    setToken(token: string): void {
      storage.set<AuthSession>(AUTH_SESSION_STORAGE_KEY, { token })
    },
    clear(): void {
      storage.remove(AUTH_SESSION_STORAGE_KEY)
    },
  }
}
