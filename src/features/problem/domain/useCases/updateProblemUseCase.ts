/**
 * @file Update problem use case.
 */
import type { ProblemRepository } from '../ports/problemRepository'
import type { ProblemStatusResponse, UpdateProblemInput } from '../models'

export type UpdateProblemUseCase = {
  execute(id: string, input: UpdateProblemInput): Promise<ProblemStatusResponse>
}

/**
 * Create update-problem use case.
 * @param repository Problem repository
 * @returns use case
 */
export function createUpdateProblemUseCase(repository: ProblemRepository): UpdateProblemUseCase {
  return {
    async execute(id: string, input: UpdateProblemInput): Promise<ProblemStatusResponse> {
      return repository.update(id, input)
    },
  }
}
