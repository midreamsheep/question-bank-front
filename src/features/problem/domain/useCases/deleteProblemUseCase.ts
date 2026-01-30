/**
 * @file Delete problem use case.
 */
import type { ProblemRepository } from '../ports/problemRepository'

export type DeleteProblemUseCase = {
  execute(id: string): Promise<void>
}

/**
 * Create delete problem use case.
 * @param repository Problem repository
 * @returns use case
 */
export function createDeleteProblemUseCase(repository: ProblemRepository): DeleteProblemUseCase {
  return {
    async execute(id: string): Promise<void> {
      await repository.delete(id)
    },
  }
}
