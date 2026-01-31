/**
 * @file Update current user profile use case.
 */

import type { UpdateUserProfileInput, UserProfile } from '../models'
import type { UserRepository } from '../ports/userRepository'

export type UpdateUserProfileUseCase = {
  execute(input: UpdateUserProfileInput): Promise<UserProfile>
}

/**
 * Create update-user-profile use case.
 * @param repository - User repository.
 * @returns Use case implementation.
 */
export function createUpdateUserProfileUseCase(
  repository: UserRepository,
): UpdateUserProfileUseCase {
  return {
    async execute(input: UpdateUserProfileInput): Promise<UserProfile> {
      return repository.updateProfile(input)
    },
  }
}
