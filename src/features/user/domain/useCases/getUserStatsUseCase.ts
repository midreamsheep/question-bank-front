/**
 * @file Get current user stats use case.
 */

import type { UserStats } from '../models'
import type { UserRepository } from '../ports/userRepository'

export type GetUserStatsUseCase = {
  execute(): Promise<UserStats>
}

export function createGetUserStatsUseCase(repository: UserRepository): GetUserStatsUseCase {
  return {
    async execute(): Promise<UserStats> {
      return repository.getStats()
    },
  }
}

