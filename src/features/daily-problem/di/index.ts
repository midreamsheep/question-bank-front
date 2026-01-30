/**
 * @file Daily problem feature DI: exports public routes and dependencies.
 */
import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { HttpClient } from '../../../infrastructure/http'
import DailyProblemPage from '../presentation/pages/DailyProblemPage.vue'
import DailyHistoryPage from '../presentation/pages/DailyHistoryPage.vue'
import { HttpDailyProblemRepository } from '../data/httpDailyProblemRepository'
import { MockDailyProblemRepository } from '../mock/mockDailyProblemRepository'
import { createGetTodayDailyProblemUseCase } from '../domain/useCases/getTodayDailyProblemUseCase'
import { createGetDailyProblemByDayUseCase } from '../domain/useCases/getDailyProblemByDayUseCase'
import { createListDailyProblemsUseCase } from '../domain/useCases/listDailyProblemsUseCase'
import type { GetTodayDailyProblemUseCase } from '../domain/useCases/getTodayDailyProblemUseCase'
import type { GetDailyProblemByDayUseCase } from '../domain/useCases/getDailyProblemByDayUseCase'
import type { ListDailyProblemsUseCase } from '../domain/useCases/listDailyProblemsUseCase'

export type DailyProblemDi = {
  getTodayUseCase: GetTodayDailyProblemUseCase
  getByDayUseCase: GetDailyProblemByDayUseCase
  listHistoryUseCase: ListDailyProblemsUseCase
}

/**
 * Daily problem DI injection key.
 */
export const dailyProblemDiKey: InjectionKey<DailyProblemDi> = Symbol('dailyProblemDi')

/**
 * Create daily problem DI dependencies.
 * @param options DI options
 * @param options.httpClient HTTP client
 * @returns Daily problem DI container
 */
export function makeDailyProblemDi(options: { httpClient: HttpClient; useMock?: boolean }): DailyProblemDi {
  const repository = options.useMock
    ? new MockDailyProblemRepository()
    : new HttpDailyProblemRepository({ httpClient: options.httpClient })
  return {
    getTodayUseCase: createGetTodayDailyProblemUseCase(repository),
    getByDayUseCase: createGetDailyProblemByDayUseCase(repository),
    listHistoryUseCase: createListDailyProblemsUseCase(repository),
  }
}

/**
 * Use daily problem DI container.
 * @returns Daily problem DI container
 */
export function useDailyProblemDi(): DailyProblemDi {
  const di = inject(dailyProblemDiKey)
  if (!di) throw new Error('Daily problem DI not provided')
  return di
}

/**
 * Public routes for daily problems.
 */
export const dailyRoutes: RouteRecordRaw[] = [
  {
    path: 'daily',
    name: 'daily',
    component: DailyProblemPage,
  },
  {
    path: 'daily/history',
    name: 'daily-history',
    component: DailyHistoryPage,
  },
]
