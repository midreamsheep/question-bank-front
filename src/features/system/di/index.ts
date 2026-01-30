/**
 * @file System feature DI: exports dependencies.
 */
import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { HttpClient } from '../../../infrastructure/http'
import { HttpSystemRepository } from '../data/httpSystemRepository'
import { MockSystemRepository } from '../mock/mockSystemRepository'
import { createCheckHealthUseCase } from '../domain/useCases/checkHealthUseCase'
import type { CheckHealthUseCase } from '../domain/useCases/checkHealthUseCase'

export type SystemDi = {
  checkHealthUseCase: CheckHealthUseCase
}

/**
 * System DI injection key.
 */
export const systemDiKey: InjectionKey<SystemDi> = Symbol('systemDi')

/**
 * Create system DI dependencies.
 * @param options DI options
 * @param options.httpClient HTTP client
 * @param options.useMock use mock repository
 * @returns System DI container
 */
export function makeSystemDi(options: { httpClient: HttpClient; useMock?: boolean }): SystemDi {
  const repository = options.useMock
    ? new MockSystemRepository()
    : new HttpSystemRepository({ httpClient: options.httpClient })
  return {
    checkHealthUseCase: createCheckHealthUseCase(repository),
  }
}

/**
 * Use system DI container.
 * @returns System DI container
 */
export function useSystemDi(): SystemDi {
  const di = inject(systemDiKey)
  if (!di) throw new Error('System DI not provided')
  return di
}
