/**
 * @file Get problem detail use case.
 */
import type { ProblemRepository } from '../ports/problemRepository'
import type { ProblemDetail } from '../models'

export type GetProblemDetailUseCase = {
  execute(id: string): Promise<ProblemDetail>
}

/**
 * Create get problem detail use case.
 * @param repository Problem repository
 * @returns use case
 */
export function createGetProblemDetailUseCase(repository: ProblemRepository): GetProblemDetailUseCase {
  return {
    async execute(id: string): Promise<ProblemDetail> {
      return repository.getDetail(id)
    },
  }
}
