/**
 * @file Daily problem domain models.
 */

export type DailyProblemSummary = {
  /**
   * Daily item id (backend is long; frontend treats it as string).
   */
  id: string
  day: string
  copywriting?: string | null
  problem: {
    id: string
    title: string
    subject: string
    difficulty: number
  }
}

export type DailyProblemItem = DailyProblemSummary

export type DailyProblemQuery = {
  day: string
}

export type DailyProblemHistoryQuery = {
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export type PageResponse<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}
