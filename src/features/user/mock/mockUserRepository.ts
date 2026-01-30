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
  async getMe(): Promise<UserProfile> {
    return { ...mockStore.user }
  }

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

  async updateProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
    mockStore.user = {
      ...mockStore.user,
      nickname: input.nickname,
      avatarFileId: input.avatarFileId,
    }
    return { ...mockStore.user }
  }

  async changePassword(_input: ChangePasswordInput): Promise<void> {
    // Mock: accept any password change request.
  }

  async getStats(): Promise<UserStats> {
    return {
      problemCountByStatus: countProblemsByStatus(),
      collectionCount: mockStore.collections.length,
    }
  }
}
