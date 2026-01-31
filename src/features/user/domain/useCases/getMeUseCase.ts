/**
 * @file Get current user profile use case.
 */

import type { UserProfile } from '../models'
import type { UserRepository } from '../ports/userRepository'

export type GetMeUseCase = {
  execute(): Promise<UserProfile>
}

/**
 * Create get-me use case.
 * @param repository - User repository.
 * @returns Use case implementation.
 */
export function createGetMeUseCase(repository: UserRepository): GetMeUseCase {
  return {
    async execute(): Promise<UserProfile> {
      return repository.getMe()
    },
  }
}
