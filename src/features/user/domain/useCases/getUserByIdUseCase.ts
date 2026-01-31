/**
 * @file Get user profile by id (public profile for author pages).
 */

import type { UserProfile } from '../models'
import type { UserRepository } from '../ports/userRepository'

export type GetUserByIdUseCase = {
  execute(id: string): Promise<UserProfile>
}

/**
 * Create get-user-by-id use case.
 * @param repository - User repository.
 * @returns Use case implementation.
 */
export function createGetUserByIdUseCase(repository: UserRepository): GetUserByIdUseCase {
  return {
    async execute(id: string): Promise<UserProfile> {
      return repository.getById(id)
    },
  }
}
