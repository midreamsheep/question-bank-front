/**
 * @file Get user profile by id (public profile for author pages).
 */

import type { UserProfile } from '../models'
import type { UserRepository } from '../ports/userRepository'

export type GetUserByIdUseCase = {
  execute(id: string): Promise<UserProfile>
}

export function createGetUserByIdUseCase(repository: UserRepository): GetUserByIdUseCase {
  return {
    async execute(id: string): Promise<UserProfile> {
      return repository.getById(id)
    },
  }
}

