/**
 * @file Revoke daily problem use case.
 */
import type { AdminRepository } from '../ports/adminRepository'
import type { DailyProblemItem } from '../models'

export type RevokeDailyProblemUseCase = {
  execute(day: string): Promise<DailyProblemItem[]>
}

/**
 * Create revoke daily problem use case.
 * @param repository Admin repository
 * @returns use case
 */
export function createRevokeDailyProblemUseCase(
  repository: AdminRepository,
): RevokeDailyProblemUseCase {
  return {
    async execute(day: string): Promise<DailyProblemItem[]> {
      return repository.revokeDailyProblem(day)
    },
  }
}
