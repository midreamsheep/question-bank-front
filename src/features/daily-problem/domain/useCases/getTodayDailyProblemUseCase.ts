/**
 * @file Get today's daily problem use case.
 */
import type { DailyProblemRepository } from '../ports/dailyProblemRepository'
import type { DailyProblemSummary } from '../models'

export type GetTodayDailyProblemUseCase = {
  execute(): Promise<DailyProblemSummary[]>
}

/**
 * Create get today daily problem use case.
 * @param repository Daily problem repository
 * @returns use case
 */
export function createGetTodayDailyProblemUseCase(
  repository: DailyProblemRepository,
): GetTodayDailyProblemUseCase {
  return {
    async execute(): Promise<DailyProblemSummary[]> {
      return repository.getToday()
    },
  }
}
