/**
 * @file Update problem type use case.
 */
import type { AdminRepository } from '../ports/adminRepository'
import type { ProblemType, UpdateProblemTypeInput } from '../models'

export type UpdateProblemTypeUseCase = {
  execute(id: number, input: UpdateProblemTypeInput): Promise<ProblemType>
}

/**
 * Create update-problem-type use case.
 * @param repository Admin repository
 * @returns use case
 */
export function createUpdateProblemTypeUseCase(
  repository: AdminRepository,
): UpdateProblemTypeUseCase {
  return {
    async execute(id: number, input: UpdateProblemTypeInput): Promise<ProblemType> {
      return repository.updateProblemType(id, input)
    },
  }
}
