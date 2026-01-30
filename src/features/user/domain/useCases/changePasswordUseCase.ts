/**
 * @file Change password use case.
 */

import type { ChangePasswordInput } from '../models'
import type { UserRepository } from '../ports/userRepository'

export type ChangePasswordUseCase = {
  execute(input: ChangePasswordInput): Promise<void>
}

export function createChangePasswordUseCase(repository: UserRepository): ChangePasswordUseCase {
  return {
    async execute(input: ChangePasswordInput): Promise<void> {
      return repository.changePassword(input)
    },
  }
}

