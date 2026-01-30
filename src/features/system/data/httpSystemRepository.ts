/**
 * @file System repository HTTP implementation.
 */
import type { HttpClient } from '../../../infrastructure/http'
import { unwrapApiResponse } from '../../../infrastructure/http'
import type { ApiResponse } from '../../../infrastructure/http'
import type { SystemRepository } from '../domain/ports/systemRepository'
import type { HealthStatus } from '../domain/models'

export type HttpSystemRepositoryOptions = {
  httpClient: HttpClient
}

export class HttpSystemRepository implements SystemRepository {
  private readonly httpClient: HttpClient

  /**
   * Create HTTP system repository.
   * @param options repository options
   * @param options.httpClient HTTP client
   */
  constructor(options: HttpSystemRepositoryOptions) {
    this.httpClient = options.httpClient
  }

  async checkHealth(): Promise<HealthStatus> {
    const response = await this.httpClient.request<ApiResponse<null>>({
      method: 'GET',
      url: '/health',
    })
    unwrapApiResponse(response)
    return { ok: true }
  }
}
