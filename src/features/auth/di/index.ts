/**
 * @file Auth feature DI: exports public routes and dependency wiring.
 */
import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { HttpClient } from '../../../infrastructure/http'
import type { JsonStorage } from '../../../infrastructure/storage/jsonStorage'
import LoginPage from '../presentation/pages/LoginPage.vue'
import RegisterPage from '../presentation/pages/RegisterPage.vue'
import { HttpAuthRepository } from '../data/httpAuthRepository'
import { MockAuthRepository } from '../mock/mockAuthRepository'
import { createLoginUseCase } from '../domain/useCases/loginUseCase'
import { createRegisterUseCase } from '../domain/useCases/registerUseCase'
import { createLogoutUseCase } from '../domain/useCases/logoutUseCase'
import type { LoginUseCase } from '../domain/useCases/loginUseCase'
import type { RegisterUseCase } from '../domain/useCases/registerUseCase'
import type { LogoutUseCase } from '../domain/useCases/logoutUseCase'
import { createAuthSessionStorage } from '../data/authSessionStorage'
import type { AuthSessionStorage } from '../data/authSessionStorage'

export type AuthDi = {
  loginUseCase: LoginUseCase
  registerUseCase: RegisterUseCase
  logoutUseCase: LogoutUseCase
  sessionStorage: AuthSessionStorage
}

/**
 * Auth DI injection key.
 */
export const authDiKey: InjectionKey<AuthDi> = Symbol('authDi')

/**
 * Create auth DI dependencies.
 * @param options DI options
 * @param options.httpClient HTTP client
 * @param options.storage JSON storage
 * @param options.useMock Use mock repositories instead of HTTP ones
 * @returns Auth DI container
 */
export function makeAuthDi(options: {
  httpClient: HttpClient
  storage: JsonStorage
  useMock?: boolean
}): AuthDi {
  const repository = options.useMock
    ? new MockAuthRepository()
    : new HttpAuthRepository({ httpClient: options.httpClient })
  return {
    loginUseCase: createLoginUseCase(repository),
    registerUseCase: createRegisterUseCase(repository),
    logoutUseCase: createLogoutUseCase(repository),
    sessionStorage: createAuthSessionStorage(options.storage),
  }
}

/**
 * Use auth DI container.
 * @returns Auth DI container
 */
export function useAuthDi(): AuthDi {
  const di = inject(authDiKey)
  if (!di) throw new Error('Auth DI not provided')
  return di
}

/**
 * Public routes for authentication.
 */
export const loginRoute: RouteRecordRaw = {
  path: '/login',
  name: 'login',
  component: LoginPage,
  meta: { allowAnonymous: true },
}

/**
 * Public route for registration.
 */
export const registerRoute: RouteRecordRaw = {
  path: '/register',
  name: 'register',
  component: RegisterPage,
  meta: { allowAnonymous: true },
}
