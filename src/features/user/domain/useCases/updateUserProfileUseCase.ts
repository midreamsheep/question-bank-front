/**
 * @file Update current user profile use case.
 */

import type { UpdateUserProfileInput, UserProfile } from '../models'
import type { UserRepository } from '../ports/userRepository'

export type UpdateUserProfileUseCase = {
  execute(input: UpdateUserProfileInput): Promise<UserProfile>
}

export function createUpdateUserProfileUseCase(
  repository: UserRepository,
): UpdateUserProfileUseCase {
  return {
    async execute(input: UpdateUserProfileInput): Promise<UserProfile> {
      return repository.updateProfile(input)
    },
  }
}
