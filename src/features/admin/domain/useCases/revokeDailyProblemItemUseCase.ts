/**
 * @file Revoke a single daily problem item use case.
 */
import type { AdminRepository } from '../ports/adminRepository'
import type { DailyProblemItem } from '../models'

export type RevokeDailyProblemItemUseCase = {
  execute(id: string): Promise<DailyProblemItem>
}

/**
 * Create revoke daily problem item use case.
 * @param repository Admin repository
 * @returns use case
 */
export function createRevokeDailyProblemItemUseCase(
  repository: AdminRepository,
): RevokeDailyProblemItemUseCase {
  return {
    async execute(id: string): Promise<DailyProblemItem> {
      return repository.revokeDailyProblemItem(id)
    },
  }
}

