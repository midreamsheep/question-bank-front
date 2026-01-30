/**
 * @file Get problem by share key use case.
 */
import type { ProblemRepository } from '../ports/problemRepository'
import type { ProblemDetail } from '../models'

export type GetProblemByShareKeyUseCase = {
  execute(shareKey: string): Promise<ProblemDetail>
}

/**
 * Create get problem by share key use case.
 * @param repository Problem repository
 * @returns use case
 */
export function createGetProblemByShareKeyUseCase(
  repository: ProblemRepository,
): GetProblemByShareKeyUseCase {
  return {
    async execute(shareKey: string): Promise<ProblemDetail> {
      return repository.getByShareKey(shareKey)
    },
  }
}
