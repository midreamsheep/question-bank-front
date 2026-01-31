/**
 * @file Get current user stats use case.
 */

import type { UserStats } from '../models'
import type { UserRepository } from '../ports/userRepository'

export type GetUserStatsUseCase = {
  execute(): Promise<UserStats>
}

/**
 * Create get-user-stats use case.
 * @param repository - User repository.
 * @returns Use case implementation.
 */
export function createGetUserStatsUseCase(repository: UserRepository): GetUserStatsUseCase {
  return {
    async execute(): Promise<UserStats> {
      return repository.getStats()
    },
  }
}
