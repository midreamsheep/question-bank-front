/**
 * @file User feature DI: exports account routes and dependencies.
 */
import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { HttpClient } from '../../../infrastructure/http'
import UserProfilePage from '../presentation/pages/UserProfilePage.vue'
import UserProfileEditPage from '../presentation/pages/UserProfileEditPage.vue'
import UserPasswordPage from '../presentation/pages/UserPasswordPage.vue'
import { HttpUserRepository } from '../data/httpUserRepository'
import { MockUserRepository } from '../mock/mockUserRepository'
import { createGetMeUseCase } from '../domain/useCases/getMeUseCase'
import { createUpdateUserProfileUseCase } from '../domain/useCases/updateUserProfileUseCase'
import { createChangePasswordUseCase } from '../domain/useCases/changePasswordUseCase'
import { createGetUserStatsUseCase } from '../domain/useCases/getUserStatsUseCase'
import { createGetUserByIdUseCase } from '../domain/useCases/getUserByIdUseCase'
import type { GetMeUseCase } from '../domain/useCases/getMeUseCase'
import type { GetUserByIdUseCase } from '../domain/useCases/getUserByIdUseCase'
import type { UpdateUserProfileUseCase } from '../domain/useCases/updateUserProfileUseCase'
import type { ChangePasswordUseCase } from '../domain/useCases/changePasswordUseCase'
import type { GetUserStatsUseCase } from '../domain/useCases/getUserStatsUseCase'
import UserPublicPage from '../presentation/pages/UserPublicPage.vue'

export type UserDi = {
  getMeUseCase: GetMeUseCase
  getByIdUseCase: GetUserByIdUseCase
  updateProfileUseCase: UpdateUserProfileUseCase
  changePasswordUseCase: ChangePasswordUseCase
  getStatsUseCase: GetUserStatsUseCase
}

/**
 * User DI injection key.
 */
export const userDiKey: InjectionKey<UserDi> = Symbol('userDi')

/**
 * Create user DI dependencies.
 * @param options DI options
 * @param options.httpClient HTTP client
 * @param options.useMock Use mock repositories instead of HTTP ones
 * @returns User DI container
 */
export function makeUserDi(options: { httpClient: HttpClient; useMock?: boolean }): UserDi {
  const repository = options.useMock
    ? new MockUserRepository()
    : new HttpUserRepository({ httpClient: options.httpClient })
  return {
    getMeUseCase: createGetMeUseCase(repository),
    getByIdUseCase: createGetUserByIdUseCase(repository),
    updateProfileUseCase: createUpdateUserProfileUseCase(repository),
    changePasswordUseCase: createChangePasswordUseCase(repository),
    getStatsUseCase: createGetUserStatsUseCase(repository),
  }
}

/**
 * Use user DI container.
 * @returns User DI container
 */
export function useUserDi(): UserDi {
  const di = inject(userDiKey)
  if (!di) throw new Error('User DI not provided')
  return di
}

/**
 * Account routes for user profile.
 */
export const userAccountRoutes: RouteRecordRaw[] = [
  {
    path: 'profile',
    name: 'user-profile',
    component: UserProfilePage,
    meta: { requiresAuth: true },
  },
  {
    path: 'profile/edit',
    name: 'user-profile-edit',
    component: UserProfileEditPage,
    meta: { requiresAuth: true },
  },
  {
    path: 'profile/password',
    name: 'user-password',
    component: UserPasswordPage,
    meta: { requiresAuth: true },
  },
]

/**
 * Public routes for user pages.
 */
export const userPublicRoutes: RouteRecordRaw[] = [
  {
    path: 'users/:id',
    name: 'user-public',
    component: UserPublicPage,
  },
]
