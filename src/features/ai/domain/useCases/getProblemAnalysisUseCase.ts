/**
 * @file Get AI analysis for a problem use case.
 */

import type { AiProblemRepository } from '../ports/aiProblemRepository'
import type { AiProblemAnalysis } from '../models'

export type GetProblemAnalysisUseCase = {
  execute(problemId: string): Promise<AiProblemAnalysis>
}

/**
 * Create get-problem-analysis use case.
 * @param repository - AI problem repository.
 * @returns Use case implementation.
 */
export function createGetProblemAnalysisUseCase(repository: AiProblemRepository): GetProblemAnalysisUseCase {
  return {
    async execute(problemId: string): Promise<AiProblemAnalysis> {
      return repository.getAnalysis(problemId)
    },
  }
}

