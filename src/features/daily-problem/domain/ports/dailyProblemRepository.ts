/**
 * @file Daily problem repository port.
 */
import type { DailyProblemHistoryQuery, DailyProblemSummary, PageResponse } from '../models'

export type DailyProblemRepository = {
  getToday(): Promise<DailyProblemSummary[]>
  getByDay(day: string): Promise<DailyProblemSummary[]>
  listHistory(query: DailyProblemHistoryQuery): Promise<PageResponse<DailyProblemSummary>>
}
