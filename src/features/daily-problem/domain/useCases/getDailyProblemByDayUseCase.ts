/**
 * @file Get daily problem by day use case.
 */
import type { DailyProblemRepository } from '../ports/dailyProblemRepository'
import type { DailyProblemSummary } from '../models'

export type GetDailyProblemByDayUseCase = {
  execute(day: string): Promise<DailyProblemSummary[]>
}

/**
 * Create get daily problem by day use case.
 * @param repository Daily problem repository
 * @returns use case
 */
export function createGetDailyProblemByDayUseCase(
  repository: DailyProblemRepository,
): GetDailyProblemByDayUseCase {
  return {
    async execute(day: string): Promise<DailyProblemSummary[]> {
      return repository.getByDay(day)
    },
  }
}
