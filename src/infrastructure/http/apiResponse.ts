/**
 * @file API response models and helpers.
 */

/**
 * Standard API response wrapper.
 */
export type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

/**
 * Standard pagination response payload.
 */
export type PageResponse<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export class ApiError extends Error {
  readonly code: number

  /**
   * Create an API error for non-zero response codes.
   * @param code API error code
   * @param message API message
   */
  constructor(code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

/**
 * Unwrap API response payload or throw an ApiError.
 * @param response API response
 * @returns data payload
 */
export function unwrapApiResponse<T>(response: ApiResponse<T>): T {
  if (response.code !== 0) {
    throw new ApiError(response.code, response.message)
  }
  return response.data
}
