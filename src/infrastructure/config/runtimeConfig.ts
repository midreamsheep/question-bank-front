/**
 * @file Runtime configuration for API and mock toggles.
 */

export type RuntimeConfig = {
  apiBaseUrl: string
  useMock: boolean
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const useMock = import.meta.env.VITE_USE_MOCK === 'true'

/**
 * Runtime config values resolved from Vite env.
 */
export const runtimeConfig: RuntimeConfig = {
  apiBaseUrl,
  useMock,
}
