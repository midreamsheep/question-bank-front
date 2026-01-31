/**
 * @file Get AI problem metadata recommendations use case.
 */

import type { AiProblemRepository } from '../ports/aiProblemRepository'
import type { AiProblemMetadataRecommendations, AiProblemMetadataRecommendationsRequest } from '../models'

export type GetProblemMetadataRecommendationsUseCase = {
  execute(input: AiProblemMetadataRecommendationsRequest): Promise<AiProblemMetadataRecommendations>
}

/**
 * Create get-problem-metadata-recommendations use case.
 * @param repository - AI problem repository.
 * @returns Use case.
 */
export function createGetProblemMetadataRecommendationsUseCase(
  repository: AiProblemRepository,
): GetProblemMetadataRecommendationsUseCase {
  return {
    async execute(input: AiProblemMetadataRecommendationsRequest): Promise<AiProblemMetadataRecommendations> {
      return repository.getMetadataRecommendations(input)
    },
  }
}

