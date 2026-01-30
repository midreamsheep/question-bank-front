/**
 * @file Disable (take down) problem use case.
 */
import type { ProblemRepository } from '../ports/problemRepository'
import type { ProblemStatusResponse } from '../models'

export type DisableProblemUseCase = {
  execute(id: string): Promise<ProblemStatusResponse>
}

/**
 * Create disable-problem use case.
 * @param repository Problem repository
 * @returns use case
 */
export function createDisableProblemUseCase(repository: ProblemRepository): DisableProblemUseCase {
  return {
    async execute(id: string): Promise<ProblemStatusResponse> {
      return repository.disable(id)
    },
  }
}
