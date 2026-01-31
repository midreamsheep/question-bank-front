/**
 * @file AI feature DI: exports dependencies.
 */

import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { HttpClient } from '../../../infrastructure/http'
import { HttpAiProblemRepository } from '../data/httpAiProblemRepository'
import { MockAiProblemRepository } from '../mock/mockAiProblemRepository'
import { createGetProblemAnalysisUseCase } from '../domain/useCases/getProblemAnalysisUseCase'
import type { GetProblemAnalysisUseCase } from '../domain/useCases/getProblemAnalysisUseCase'
import { createGetProblemMetadataRecommendationsUseCase } from '../domain/useCases/getProblemMetadataRecommendationsUseCase'
import type { GetProblemMetadataRecommendationsUseCase } from '../domain/useCases/getProblemMetadataRecommendationsUseCase'

export type AiDi = {
  getProblemAnalysisUseCase: GetProblemAnalysisUseCase
  getProblemMetadataRecommendationsUseCase: GetProblemMetadataRecommendationsUseCase
}

/**
 * AI DI injection key.
 */
export const aiDiKey: InjectionKey<AiDi> = Symbol('aiDi')

/**
 * Create AI DI dependencies.
 * @param options - DI options.
 * @param options.httpClient - HTTP client.
 * @param options.useMock - Use mock repositories instead of HTTP ones.
 * @returns AI DI container.
 */
export function makeAiDi(options: { httpClient: HttpClient; useMock?: boolean }): AiDi {
  const repository = options.useMock
    ? new MockAiProblemRepository()
    : new HttpAiProblemRepository({ httpClient: options.httpClient })
  return {
    getProblemAnalysisUseCase: createGetProblemAnalysisUseCase(repository),
    getProblemMetadataRecommendationsUseCase: createGetProblemMetadataRecommendationsUseCase(repository),
  }
}

/**
 * Use AI DI container.
 * @returns AI DI container.
 */
export function useAiDi(): AiDi {
  const di = inject(aiDiKey)
  if (!di) throw new Error('AI DI not provided')
  return di
}
