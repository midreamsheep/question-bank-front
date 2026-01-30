/**
 * @file List admin problem types use case.
 */
import type { AdminRepository } from '../ports/adminRepository'
import type { ProblemType } from '../models'

export type ListAdminProblemTypesUseCase = {
  execute(): Promise<ProblemType[]>
}

/**
 * Create list admin problem types use case.
 * @param repository Admin repository
 * @returns use case
 */
export function createListAdminProblemTypesUseCase(
  repository: AdminRepository,
): ListAdminProblemTypesUseCase {
  return {
    async execute(): Promise<ProblemType[]> {
      return repository.listProblemTypes()
    },
  }
}
