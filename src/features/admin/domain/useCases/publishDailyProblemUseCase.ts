/**
 * @file Publish daily problem use case.
 */
import type { AdminRepository } from '../ports/adminRepository'
import type { DailyProblemItem, PublishDailyProblemInput } from '../models'

export type PublishDailyProblemUseCase = {
  execute(input: PublishDailyProblemInput): Promise<DailyProblemItem>
}

/**
 * Create publish daily problem use case.
 * @param repository Admin repository
 * @returns use case
 */
export function createPublishDailyProblemUseCase(
  repository: AdminRepository,
): PublishDailyProblemUseCase {
  return {
    async execute(input: PublishDailyProblemInput): Promise<DailyProblemItem> {
      return repository.publishDailyProblem(input)
    },
  }
}
