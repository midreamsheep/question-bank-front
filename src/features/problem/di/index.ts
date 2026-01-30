/**
 * @file Problem feature DI: exports routes and dependencies.
 */
import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { HttpClient } from '../../../infrastructure/http'
import ProblemListPage from '../presentation/pages/ProblemListPage.vue'
import ProblemDetailPage from '../presentation/pages/ProblemDetailPage.vue'
import ProblemSharePage from '../presentation/pages/ProblemSharePage.vue'
import ProblemEditorPage from '../presentation/pages/ProblemEditorPage.vue'
import MyProblemListPage from '../presentation/pages/MyProblemListPage.vue'
import { HttpProblemRepository } from '../data/httpProblemRepository'
import { MockProblemRepository } from '../mock/mockProblemRepository'
import { createListProblemsUseCase } from '../domain/useCases/listProblemsUseCase'
import { createListMyProblemsUseCase } from '../domain/useCases/listMyProblemsUseCase'
import { createGetProblemDetailUseCase } from '../domain/useCases/getProblemDetailUseCase'
import { createGetProblemByShareKeyUseCase } from '../domain/useCases/getProblemByShareKeyUseCase'
import { createCreateProblemUseCase } from '../domain/useCases/createProblemUseCase'
import { createUpdateProblemUseCase } from '../domain/useCases/updateProblemUseCase'
import { createPublishProblemUseCase } from '../domain/useCases/publishProblemUseCase'
import { createDisableProblemUseCase } from '../domain/useCases/disableProblemUseCase'
import { createDeleteProblemUseCase } from '../domain/useCases/deleteProblemUseCase'
import type { ListProblemsUseCase } from '../domain/useCases/listProblemsUseCase'
import type { ListMyProblemsUseCase } from '../domain/useCases/listMyProblemsUseCase'
import type { GetProblemDetailUseCase } from '../domain/useCases/getProblemDetailUseCase'
import type { GetProblemByShareKeyUseCase } from '../domain/useCases/getProblemByShareKeyUseCase'
import type { CreateProblemUseCase } from '../domain/useCases/createProblemUseCase'
import type { UpdateProblemUseCase } from '../domain/useCases/updateProblemUseCase'
import type { PublishProblemUseCase } from '../domain/useCases/publishProblemUseCase'
import type { DisableProblemUseCase } from '../domain/useCases/disableProblemUseCase'
import type { DeleteProblemUseCase } from '../domain/useCases/deleteProblemUseCase'

export type ProblemDi = {
  listUseCase: ListProblemsUseCase
  listMineUseCase: ListMyProblemsUseCase
  getDetailUseCase: GetProblemDetailUseCase
  getByShareKeyUseCase: GetProblemByShareKeyUseCase
  createUseCase: CreateProblemUseCase
  updateUseCase: UpdateProblemUseCase
  publishUseCase: PublishProblemUseCase
  disableUseCase: DisableProblemUseCase
  deleteUseCase: DeleteProblemUseCase
}

/**
 * Problem DI injection key.
 */
export const problemDiKey: InjectionKey<ProblemDi> = Symbol('problemDi')

/**
 * Create problem DI dependencies.
 * @param options DI options
 * @param options.httpClient HTTP client
 * @returns Problem DI container
 */
export function makeProblemDi(options: { httpClient: HttpClient; useMock?: boolean }): ProblemDi {
  const repository = options.useMock
    ? new MockProblemRepository()
    : new HttpProblemRepository({ httpClient: options.httpClient })
  return {
    listUseCase: createListProblemsUseCase(repository),
    listMineUseCase: createListMyProblemsUseCase(repository),
    getDetailUseCase: createGetProblemDetailUseCase(repository),
    getByShareKeyUseCase: createGetProblemByShareKeyUseCase(repository),
    createUseCase: createCreateProblemUseCase(repository),
    updateUseCase: createUpdateProblemUseCase(repository),
    publishUseCase: createPublishProblemUseCase(repository),
    disableUseCase: createDisableProblemUseCase(repository),
    deleteUseCase: createDeleteProblemUseCase(repository),
  }
}

/**
 * Use problem DI container.
 * @returns Problem DI container
 */
export function useProblemDi(): ProblemDi {
  const di = inject(problemDiKey)
  if (!di) throw new Error('Problem DI not provided')
  return di
}

/**
 * Public routes for problems.
 */
export const problemPublicRoutes: RouteRecordRaw[] = [
  {
    path: 'problems',
    name: 'problems',
    component: ProblemListPage,
  },
  {
    path: 'problems/share/:shareKey',
    name: 'problem-share',
    component: ProblemSharePage,
  },
  {
    path: 'problems/:id',
    name: 'problem-detail',
    component: ProblemDetailPage,
  },
]

/**
 * Authenticated routes for problems.
 */
export const problemAccountRoutes: RouteRecordRaw[] = [
  {
    path: 'problems',
    name: 'my-problems',
    component: MyProblemListPage,
    meta: { requiresAuth: true },
  },
  {
    path: 'problems/new',
    name: 'problem-create',
    component: ProblemEditorPage,
    meta: { requiresAuth: true },
  },
  {
    path: 'problems/:id/edit',
    name: 'problem-edit',
    component: ProblemEditorPage,
    meta: { requiresAuth: true },
  },
]
