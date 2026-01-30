/**
 * @file Create problem use case.
 */
import type { ProblemRepository } from '../ports/problemRepository'
import type { CreateProblemInput, ProblemCreateResponse } from '../models'

export type CreateProblemUseCase = {
  execute(input: CreateProblemInput): Promise<ProblemCreateResponse>
}

/**
 * Create create-problem use case.
 * @param repository Problem repository
 * @returns use case
 */
export function createCreateProblemUseCase(repository: ProblemRepository): CreateProblemUseCase {
  return {
    async execute(input: CreateProblemInput): Promise<ProblemCreateResponse> {
      return repository.create(input)
    },
  }
}
