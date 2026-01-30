/**
 * @file Mock daily problem repository.
 */
import type { DailyProblemRepository } from '../domain/ports/dailyProblemRepository'
import type { DailyProblemHistoryQuery, DailyProblemSummary, PageResponse } from '../domain/models'
import { mockStore } from '../../../infrastructure/mock/mockStore'

/**
 * Build daily summary sorted by day (desc).
 * @returns sorted daily summaries
 */
function sortedDailyProblems(): DailyProblemSummary[] {
  return [...mockStore.dailyProblems].sort((a, b) => b.day.localeCompare(a.day))
}

function findByDay(day: string): DailyProblemSummary[] {
  return mockStore.dailyProblems.filter((item) => item.day === day)
}

export class MockDailyProblemRepository implements DailyProblemRepository {
  async getToday(): Promise<DailyProblemSummary[]> {
    const sorted = sortedDailyProblems()
    if (!sorted.length) throw new Error('Daily problem not found')
    const first = sorted[0]
    if (!first) throw new Error('Daily problem not found')
    return findByDay(first.day)
  }

  async getByDay(day: string): Promise<DailyProblemSummary[]> {
    const items = findByDay(day)
    if (!items.length) throw new Error('Daily problem not found')
    return items
  }

  async listHistory(query: DailyProblemHistoryQuery): Promise<PageResponse<DailyProblemSummary>> {
    const filtered = sortedDailyProblems().filter((item) => {
      if (query.from && item.day < query.from) return false
      if (query.to && item.day > query.to) return false
      return true
    })
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const total = filtered.length
    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)
    return {
      items,
      page,
      pageSize,
      total,
    }
  }
}
