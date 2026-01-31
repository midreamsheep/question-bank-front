/**
 * @file Daily problem repository HTTP implementation.
 */
import type { HttpClient } from '../../../infrastructure/http'
import { unwrapApiResponse } from '../../../infrastructure/http'
import type { ApiResponse } from '../../../infrastructure/http'
import type { DailyProblemRepository } from '../domain/ports/dailyProblemRepository'
import type { DailyProblemHistoryQuery, DailyProblemSummary, PageResponse } from '../domain/models'

export type HttpDailyProblemRepositoryOptions = {
  httpClient: HttpClient
}

export class HttpDailyProblemRepository implements DailyProblemRepository {
  private readonly httpClient: HttpClient

  /**
   * Create HTTP daily problem repository.
   * @param options repository options
   * @param options.httpClient HTTP client
   */
  constructor(options: HttpDailyProblemRepositoryOptions) {
    this.httpClient = options.httpClient
  }

  /**
   * Get today's daily problem set.
   * @returns Daily problem summaries.
   */
  async getToday(): Promise<DailyProblemSummary[]> {
    const response = await this.httpClient.request<ApiResponse<DailyProblemSummary[]>>({
      method: 'GET',
      url: '/daily-problem/today',
    })
    const data = unwrapApiResponse(response)
    return data.map((item) => ({
      ...item,
      id: String(item.id),
      problem: { ...item.problem, id: String(item.problem.id) },
    }))
  }

  /**
   * Get daily problems by day.
   * @param day - Day string (YYYY-MM-DD).
   * @returns Daily problem summaries.
   */
  async getByDay(day: string): Promise<DailyProblemSummary[]> {
    const response = await this.httpClient.request<ApiResponse<DailyProblemSummary[]>>({
      method: 'GET',
      url: '/daily-problem',
      query: { day },
    })
    const data = unwrapApiResponse(response)
    return data.map((item) => ({
      ...item,
      id: String(item.id),
      problem: { ...item.problem, id: String(item.problem.id) },
    }))
  }

  /**
   * List daily problem history.
   * @param query - History query.
   * @returns Paged daily problem summaries.
   */
  async listHistory(query: DailyProblemHistoryQuery): Promise<PageResponse<DailyProblemSummary>> {
    const response = await this.httpClient.request<ApiResponse<PageResponse<DailyProblemSummary>>>({
      method: 'GET',
      url: '/daily-problems',
      query,
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      items: data.items.map((item) => ({
        ...item,
        id: String(item.id),
        problem: { ...item.problem, id: String(item.problem.id) },
      })),
    }
  }
}
