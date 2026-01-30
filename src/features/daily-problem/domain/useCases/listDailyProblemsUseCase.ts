/**
 * @file List daily problems use case.
 */
import type { DailyProblemRepository } from '../ports/dailyProblemRepository'
import type { DailyProblemHistoryQuery, DailyProblemSummary, PageResponse } from '../models'

export type ListDailyProblemsUseCase = {
  execute(query: DailyProblemHistoryQuery): Promise<PageResponse<DailyProblemSummary>>
}

/**
 * Create list daily problems use case.
 * @param repository Daily problem repository
 * @returns use case
 */
export function createListDailyProblemsUseCase(
  repository: DailyProblemRepository,
): ListDailyProblemsUseCase {
  return {
    async execute(query: DailyProblemHistoryQuery): Promise<PageResponse<DailyProblemSummary>> {
      return repository.listHistory(query)
    },
  }
}
