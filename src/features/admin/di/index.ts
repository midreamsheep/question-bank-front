/**
 * @file Admin feature DI: exports admin routes and dependencies.
 */
import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { HttpClient } from '../../../infrastructure/http'
import AdminDashboardPage from '../presentation/pages/AdminDashboardPage.vue'
import AdminProblemsPage from '../presentation/pages/AdminProblemsPage.vue'
import AdminDailyPage from '../presentation/pages/AdminDailyPage.vue'
import AdminCategoriesPage from '../presentation/pages/AdminCategoriesPage.vue'
import AdminProblemTypesPage from '../presentation/pages/AdminProblemTypesPage.vue'
import AdminTagsPage from '../presentation/pages/AdminTagsPage.vue'
import { HttpAdminRepository } from '../data/httpAdminRepository'
import { MockAdminRepository } from '../mock/mockAdminRepository'
import { createListAdminCategoriesUseCase } from '../domain/useCases/listAdminCategoriesUseCase'
import { createListAdminProblemTypesUseCase } from '../domain/useCases/listAdminProblemTypesUseCase'
import { createListAdminTagsUseCase } from '../domain/useCases/listAdminTagsUseCase'
import { createCreateCategoryUseCase } from '../domain/useCases/createCategoryUseCase'
import { createUpdateCategoryUseCase } from '../domain/useCases/updateCategoryUseCase'
import { createCreateProblemTypeUseCase } from '../domain/useCases/createProblemTypeUseCase'
import { createUpdateProblemTypeUseCase } from '../domain/useCases/updateProblemTypeUseCase'
import { createCreateTagUseCase } from '../domain/useCases/createTagUseCase'
import { createPublishDailyProblemUseCase } from '../domain/useCases/publishDailyProblemUseCase'
import { createRevokeDailyProblemUseCase } from '../domain/useCases/revokeDailyProblemUseCase'
import { createRevokeDailyProblemItemUseCase } from '../domain/useCases/revokeDailyProblemItemUseCase'
import { createDisableProblemUseCase } from '../domain/useCases/disableProblemUseCase'
import type { ListAdminCategoriesUseCase } from '../domain/useCases/listAdminCategoriesUseCase'
import type { ListAdminProblemTypesUseCase } from '../domain/useCases/listAdminProblemTypesUseCase'
import type { ListAdminTagsUseCase } from '../domain/useCases/listAdminTagsUseCase'
import type { CreateCategoryUseCase } from '../domain/useCases/createCategoryUseCase'
import type { UpdateCategoryUseCase } from '../domain/useCases/updateCategoryUseCase'
import type { CreateProblemTypeUseCase } from '../domain/useCases/createProblemTypeUseCase'
import type { UpdateProblemTypeUseCase } from '../domain/useCases/updateProblemTypeUseCase'
import type { CreateTagUseCase } from '../domain/useCases/createTagUseCase'
import type { PublishDailyProblemUseCase } from '../domain/useCases/publishDailyProblemUseCase'
import type { RevokeDailyProblemUseCase } from '../domain/useCases/revokeDailyProblemUseCase'
import type { RevokeDailyProblemItemUseCase } from '../domain/useCases/revokeDailyProblemItemUseCase'
import type { DisableProblemUseCase } from '../domain/useCases/disableProblemUseCase'

export type AdminDi = {
  listCategoriesUseCase: ListAdminCategoriesUseCase
  listProblemTypesUseCase: ListAdminProblemTypesUseCase
  listTagsUseCase: ListAdminTagsUseCase
  createCategoryUseCase: CreateCategoryUseCase
  updateCategoryUseCase: UpdateCategoryUseCase
  createProblemTypeUseCase: CreateProblemTypeUseCase
  updateProblemTypeUseCase: UpdateProblemTypeUseCase
  createTagUseCase: CreateTagUseCase
  publishDailyProblemUseCase: PublishDailyProblemUseCase
  revokeDailyProblemUseCase: RevokeDailyProblemUseCase
  revokeDailyProblemItemUseCase: RevokeDailyProblemItemUseCase
  disableProblemUseCase: DisableProblemUseCase
}

/**
 * Admin DI injection key.
 */
export const adminDiKey: InjectionKey<AdminDi> = Symbol('adminDi')

/**
 * Create admin DI dependencies.
 * @param options DI options
 * @param options.httpClient HTTP client
 * @param options.useMock Use mock repositories instead of HTTP ones
 * @returns Admin DI container
 */
export function makeAdminDi(options: { httpClient: HttpClient; useMock?: boolean }): AdminDi {
  const repository = options.useMock
    ? new MockAdminRepository()
    : new HttpAdminRepository({ httpClient: options.httpClient })
  return {
    listCategoriesUseCase: createListAdminCategoriesUseCase(repository),
    listProblemTypesUseCase: createListAdminProblemTypesUseCase(repository),
    listTagsUseCase: createListAdminTagsUseCase(repository),
    createCategoryUseCase: createCreateCategoryUseCase(repository),
    updateCategoryUseCase: createUpdateCategoryUseCase(repository),
    createProblemTypeUseCase: createCreateProblemTypeUseCase(repository),
    updateProblemTypeUseCase: createUpdateProblemTypeUseCase(repository),
    createTagUseCase: createCreateTagUseCase(repository),
    publishDailyProblemUseCase: createPublishDailyProblemUseCase(repository),
    revokeDailyProblemUseCase: createRevokeDailyProblemUseCase(repository),
    revokeDailyProblemItemUseCase: createRevokeDailyProblemItemUseCase(repository),
    disableProblemUseCase: createDisableProblemUseCase(repository),
  }
}

/**
 * Use admin DI container.
 * @returns Admin DI container
 */
export function useAdminDi(): AdminDi {
  const di = inject(adminDiKey)
  if (!di) throw new Error('Admin DI not provided')
  return di
}

/**
 * Admin routes for operations management.
 */
export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'admin-dashboard',
    component: AdminDashboardPage,
  },
  {
    path: 'problems',
    name: 'admin-problems',
    component: AdminProblemsPage,
  },
  {
    path: 'daily',
    name: 'admin-daily',
    component: AdminDailyPage,
  },
  {
    path: 'categories',
    name: 'admin-categories',
    component: AdminCategoriesPage,
  },
  {
    path: 'problem-types',
    name: 'admin-problem-types',
    component: AdminProblemTypesPage,
  },
  {
    path: 'tags',
    name: 'admin-tags',
    component: AdminTagsPage,
  },
]
