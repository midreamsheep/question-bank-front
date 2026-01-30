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
 */
export function createGetMeUseCase(repository: UserRepository): GetMeUseCase {
  return {
    async execute(): Promise<UserProfile> {
      return repository.getMe()
    },
  }
}
