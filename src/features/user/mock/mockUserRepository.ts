/**
 * @file Mock user repository.
 */

import type { UserRepository } from '../domain/ports/userRepository'
import type {
  ChangePasswordInput,
  UpdateUserProfileInput,
  UserProfile,
  UserStats,
} from '../domain/models'
import { mockStore } from '../../../infrastructure/mock/mockStore'

/**
 * Count problems by status in the mock store.
 * @returns Problem count grouped by status.
 */
function countProblemsByStatus(): UserStats['problemCountByStatus'] {
  const result: UserStats['problemCountByStatus'] = {
    DRAFT: 0,
    PUBLISHED: 0,
    DISABLED: 0,
  }
  for (const problem of mockStore.problems) {
    if (problem.status in result) {
      result[problem.status as keyof typeof result] += 1
    }
  }
  return result
}

export class MockUserRepository implements UserRepository {
  /**
   * Get current user profile.
   * @returns User profile.
   */
  async getMe(): Promise<UserProfile> {
    return { ...mockStore.user }
  }

  /**
   * Get user profile by id.
   * @param id - User id.
   * @returns User profile.
   */
  async getById(id: string): Promise<UserProfile> {
    // Mock: derive a minimal profile for authors from existing mock problems.
    if (id === mockStore.user.id) return { ...mockStore.user }
    const fromProblem = mockStore.problems.find((p) => String(p.author?.id ?? '') === id)?.author
    const nickname = fromProblem?.nickname?.trim() ? String(fromProblem.nickname) : `User ${id}`
    return {
      id: String(id),
      username: `user${id}`,
      nickname,
      avatarFileId: null,
      status: 'ACTIVE',
    }
  }

  /**
   * Update current user profile in mock store.
   * @param input - Update input.
   * @returns Updated profile.
   */
  async updateProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
    mockStore.user = {
      ...mockStore.user,
      nickname: input.nickname,
      avatarFileId: input.avatarFileId,
    }
    return { ...mockStore.user }
  }

  /**
   * Change user password (mock: no-op).
   * @param _input - Change password input.
   */
  async changePassword(_input: ChangePasswordInput): Promise<void> {
    // Mock: accept any password change request.
    void _input
  }

  /**
   * Get stats for current user.
   * @returns User stats.
   */
  async getStats(): Promise<UserStats> {
    return {
      problemCountByStatus: countProblemsByStatus(),
      collectionCount: mockStore.collections.length,
    }
  }
}
