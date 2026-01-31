/**
 * @file Logout use case.
 */

import type { AuthRepository } from '../ports/authRepository'

export type LogoutUseCase = {
  execute(): Promise<void>
}

/**
 * Create logout use case.
 * @param repository - Auth repository.
 * @returns Use case implementation.
 */
export function createLogoutUseCase(repository: AuthRepository): LogoutUseCase {
  return {
    async execute(): Promise<void> {
      return repository.logout()
    },
  }
}
