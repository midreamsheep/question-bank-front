/**
 * @file AI problem repository port.
 */

import type { AiProblemAnalysis, AiProblemMetadataRecommendations, AiProblemMetadataRecommendationsRequest } from '../models'

export type AiProblemRepository = {
  /**
   * Get AI analysis for a published problem.
   * @param problemId - Problem id.
   * @returns AI analysis object.
   */
  getAnalysis(problemId: string): Promise<AiProblemAnalysis>

  /**
   * Get AI recommendations for problem metadata (title/subject/difficulty/tags).
   * @param input - Current editor content.
   * @returns Recommendations.
   */
  getMetadataRecommendations(input: AiProblemMetadataRecommendationsRequest): Promise<AiProblemMetadataRecommendations>
}
