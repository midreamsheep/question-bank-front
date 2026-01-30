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

  constructor(options: HttpUserRepositoryOptions) {
    this.httpClient = options.httpClient
  }

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

  async changePassword(input: ChangePasswordInput): Promise<void> {
    const response = await this.httpClient.request<ApiResponse<unknown>>({
      method: 'PUT',
      url: '/users/me/password',
      body: input,
    })
    unwrapApiResponse(response)
  }

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
