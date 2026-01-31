/**
 * @file Unit tests for get-me use case.
 */
import { describe, expect, it } from 'vitest'
import { createGetMeUseCase } from './getMeUseCase'
import type { UserRepository } from '../ports/userRepository'

describe('getMeUseCase', () => {
  it('delegates to repository.getMe', async () => {
    const repository: UserRepository = {
      async getMe() {
        return {
          id: '1',
          username: 'demo',
          nickname: null,
          avatarFileId: null,
          status: 'ACTIVE',
        }
      },
      async getById() {
        throw new Error('not used')
      },
      async updateProfile() {
        throw new Error('not used')
      },
      async changePassword() {
        throw new Error('not used')
      },
      async getStats() {
        throw new Error('not used')
      },
    }

    const useCase = createGetMeUseCase(repository)
    const me = await useCase.execute()
    expect(me.username).toBe('demo')
  })
})
