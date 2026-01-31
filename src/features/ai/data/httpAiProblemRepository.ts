/**
 * @file AI problem repository HTTP implementation.
 */

import type { HttpClient } from '../../../infrastructure/http'
import { unwrapApiResponse } from '../../../infrastructure/http'
import type { ApiResponse } from '../../../infrastructure/http'
import type { AiProblemRepository } from '../domain/ports/aiProblemRepository'
import type { AiProblemAnalysis, AiProblemMetadataRecommendations, AiProblemMetadataRecommendationsRequest } from '../domain/models'

export type HttpAiProblemRepositoryOptions = {
  httpClient: HttpClient
}

export class HttpAiProblemRepository implements AiProblemRepository {
  private readonly httpClient: HttpClient

  /**
   * Create HTTP AI problem repository.
   * @param options - Repository options.
   * @param options.httpClient - HTTP client.
   */
  constructor(options: HttpAiProblemRepositoryOptions) {
    this.httpClient = options.httpClient
  }

  /**
   * Get AI analysis for a published problem.
   * @param problemId - Problem id.
   * @returns AI analysis object.
   */
  async getAnalysis(problemId: string): Promise<AiProblemAnalysis> {
    const response = await this.httpClient.request<ApiResponse<AiProblemAnalysis>>({
      method: 'GET',
      url: `/ai/problem/${encodeURIComponent(problemId)}/analysis`,
    })
    return unwrapApiResponse(response)
  }

  /**
   * Get AI recommendations for problem metadata (title/subject/difficulty/tags).
   * @param input - Current editor content.
   * @returns Recommendations.
   */
  async getMetadataRecommendations(
    input: AiProblemMetadataRecommendationsRequest,
  ): Promise<AiProblemMetadataRecommendations> {
    const response = await this.httpClient.request<ApiResponse<AiProblemMetadataRecommendations>>({
      method: 'POST',
      url: '/ai/problem/metadata-recommendations',
      body: input,
    })
    return unwrapApiResponse(response)
  }
}
