/**
 * @file User repository HTTP implementation.
 */

import type { HttpClient } from '../../../infrastructure/http'
import { unwrapApiResponse } from '../../../infrastructure/http'
import type { ApiResponse } from '../../../infrastructure/http'
import type { UserRepository } from '../domain/ports/userRepository'
import type {
  ChangePasswordInput,
  UpdateUserProfileInput,
  UserProfile,
  UserStats,
} from '../domain/models'

export type HttpUserRepositoryOptions = {
  httpClient: HttpClient
}

export class HttpUserRepository implements UserRepository {
  private readonly httpClient: HttpClient

  /**
   * Create HTTP user repository.
   * @param options - Repository options.
   * @param options.httpClient - HTTP client.
   */
  constructor(options: HttpUserRepositoryOptions) {
    this.httpClient = options.httpClient
  }

  /**
   * Get current user profile.
   * @returns User profile.
   */
  async getMe(): Promise<UserProfile> {
    const response = await this.httpClient.request<ApiResponse<UserProfile>>({
      method: 'GET',
      url: '/users/me',
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      id: String(data.id),
      avatarFileId: data.avatarFileId === null || data.avatarFileId === undefined ? null : String(data.avatarFileId),
    }
  }

  /**
   * Get user profile by id.
   * @param id - User id.
   * @returns User profile.
   */
  async getById(id: string): Promise<UserProfile> {
    const response = await this.httpClient.request<ApiResponse<UserProfile>>({
      method: 'GET',
      url: `/users/${id}`,
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      id: String(data.id),
      avatarFileId: data.avatarFileId === null || data.avatarFileId === undefined ? null : String(data.avatarFileId),
    }
  }

  /**
   * Update current user's profile.
   * @param input - Update input.
   * @returns Updated profile.
   */
  async updateProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
    const response = await this.httpClient.request<ApiResponse<UserProfile>>({
      method: 'PUT',
      url: '/users/me',
      body: input,
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      id: String(data.id),
      avatarFileId: data.avatarFileId === null || data.avatarFileId === undefined ? null : String(data.avatarFileId),
    }
  }

  /**
   * Change current user's password.
   * @param input - Change password input.
   * @returns Promise resolved when operation completes.
   */
  async changePassword(input: ChangePasswordInput): Promise<void> {
    const response = await this.httpClient.request<ApiResponse<unknown>>({
      method: 'PUT',
      url: '/users/me/password',
      body: input,
    })
    unwrapApiResponse(response)
  }

  /**
   * Get derived stats for current user.
   * @returns User stats.
   */
  async getStats(): Promise<UserStats> {
    // Derived stats: query totals from existing paging endpoints.
    const getTotal = async (url: string, query?: Record<string, string | number | boolean | null | undefined>) => {
      const response = await this.httpClient.request<ApiResponse<{ items: unknown[]; page: number; pageSize: number; total: number }>>({
        method: 'GET',
        url,
        query,
      })
      return unwrapApiResponse(response).total
    }

    const [draft, published, disabled, collections] = await Promise.all([
      getTotal('/users/me/problems', { status: 'DRAFT', page: 1, pageSize: 1 }),
      getTotal('/users/me/problems', { status: 'PUBLISHED', page: 1, pageSize: 1 }),
      getTotal('/users/me/problems', { status: 'DISABLED', page: 1, pageSize: 1 }),
      getTotal('/users/me/collections', { page: 1, pageSize: 1 }),
    ])

    return {
      problemCountByStatus: {
        DRAFT: draft,
        PUBLISHED: published,
        DISABLED: disabled,
      },
      collectionCount: collections,
    }
  }
}
