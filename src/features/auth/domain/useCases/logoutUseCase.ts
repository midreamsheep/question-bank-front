/**
 * @file Logout use case.
 */

import type { AuthRepository } from '../ports/authRepository'

export type LogoutUseCase = {
  execute(): Promise<void>
}

export function createLogoutUseCase(repository: AuthRepository): LogoutUseCase {
  return {
    async execute(): Promise<void> {
      return repository.logout()
    },
  }
}

