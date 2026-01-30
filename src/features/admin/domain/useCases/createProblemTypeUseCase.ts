/**
 * @file Create problem type use case.
 */
import type { AdminRepository } from '../ports/adminRepository'
import type { CreateProblemTypeInput, ProblemType } from '../models'

export type CreateProblemTypeUseCase = {
  execute(input: CreateProblemTypeInput): Promise<ProblemType>
}

/**
 * Create create-problem-type use case.
 * @param repository Admin repository
 * @returns use case
 */
export function createCreateProblemTypeUseCase(
  repository: AdminRepository,
): CreateProblemTypeUseCase {
  return {
    async execute(input: CreateProblemTypeInput): Promise<ProblemType> {
      return repository.createProblemType(input)
    },
  }
}
