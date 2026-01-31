/**
 * @file Admin repository HTTP implementation.
 */
import type { HttpClient } from '../../../infrastructure/http'
import { unwrapApiResponse } from '../../../infrastructure/http'
import type { ApiResponse } from '../../../infrastructure/http'
import type { AdminRepository } from '../domain/ports/adminRepository'
import type {
  Category,
  CreateCategoryInput,
  CreateProblemTypeInput,
  CreateTagInput,
  DailyProblemItem,
  ProblemType,
  PublishDailyProblemInput,
  Tag,
  UpdateCategoryInput,
  UpdateProblemTypeInput,
} from '../domain/models'

export type HttpAdminRepositoryOptions = {
  httpClient: HttpClient
}

export class HttpAdminRepository implements AdminRepository {
  private readonly httpClient: HttpClient

  /**
   * Create HTTP admin repository.
   * @param options repository options
   * @param options.httpClient HTTP client
   */
  constructor(options: HttpAdminRepositoryOptions) {
    this.httpClient = options.httpClient
  }

  /**
   * List categories for admin management.
   * @returns categories
   */
  async listCategories(): Promise<Category[]> {
    const response = await this.httpClient.request<ApiResponse<Category[]>>({
      method: 'GET',
      url: '/categories',
    })
    return unwrapApiResponse(response)
  }

  /**
   * List problem types for admin management.
   * @returns problem types
   */
  async listProblemTypes(): Promise<ProblemType[]> {
    const response = await this.httpClient.request<ApiResponse<ProblemType[]>>({
      method: 'GET',
      url: '/problem-types',
    })
    return unwrapApiResponse(response)
  }

  /**
   * List tags for admin management.
   * @returns tags
   */
  async listTags(): Promise<Tag[]> {
    const response = await this.httpClient.request<ApiResponse<Tag[]>>({
      method: 'GET',
      url: '/tags',
    })
    return unwrapApiResponse(response)
  }

  /**
   * Create a new category.
   * @param input create payload
   * @returns created category
   */
  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const response = await this.httpClient.request<ApiResponse<Category>>({
      method: 'POST',
      url: '/admin/categories',
      body: input,
    })
    return unwrapApiResponse(response)
  }

  /**
   * Update an existing category.
   * @param id category id
   * @param input update payload
   * @returns updated category
   */
  async updateCategory(id: number, input: UpdateCategoryInput): Promise<Category> {
    const response = await this.httpClient.request<ApiResponse<Category>>({
      method: 'PUT',
      url: `/admin/categories/${id}`,
      body: input,
    })
    return unwrapApiResponse(response)
  }

  /**
   * Create a new problem type.
   * @param input create payload
   * @returns created problem type
   */
  async createProblemType(input: CreateProblemTypeInput): Promise<ProblemType> {
    const response = await this.httpClient.request<ApiResponse<ProblemType>>({
      method: 'POST',
      url: '/admin/problem-types',
      body: input,
    })
    return unwrapApiResponse(response)
  }

  /**
   * Update an existing problem type.
   * @param id problem type id
   * @param input update payload
   * @returns updated problem type
   */
  async updateProblemType(id: number, input: UpdateProblemTypeInput): Promise<ProblemType> {
    const response = await this.httpClient.request<ApiResponse<ProblemType>>({
      method: 'PUT',
      url: `/admin/problem-types/${id}`,
      body: input,
    })
    return unwrapApiResponse(response)
  }

  /**
   * Create a new tag.
   * @param input create payload
   * @returns created tag
   */
  async createTag(input: CreateTagInput): Promise<Tag> {
    const response = await this.httpClient.request<ApiResponse<Tag>>({
      method: 'POST',
      url: '/admin/tags',
      body: input,
    })
    return unwrapApiResponse(response)
  }

  /**
   * Publish a problem as daily content.
   * @param input publish payload
   * @returns daily problem item
   */
  async publishDailyProblem(input: PublishDailyProblemInput): Promise<DailyProblemItem> {
    const response = await this.httpClient.request<ApiResponse<DailyProblemItem>>({
      method: 'POST',
      url: '/admin/daily-problems',
      body: input,
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      id: String(data.id),
      problem: { ...data.problem, id: String(data.problem.id) },
    }
  }

  /**
   * Revoke daily problem by day (may return multiple items).
   * @param day day string (YYYY-MM-DD)
   * @returns revoked daily items
   */
  async revokeDailyProblem(day: string): Promise<DailyProblemItem[]> {
    const response = await this.httpClient.request<ApiResponse<DailyProblemItem[]>>({
      method: 'POST',
      url: `/admin/daily-problems/${day}/revoke`,
    })
    const data = unwrapApiResponse(response)
    return data.map((item) => ({
      ...item,
      id: String(item.id),
      problem: { ...item.problem, id: String(item.problem.id) },
    }))
  }

  /**
   * Revoke a single daily problem item.
   * @param id daily item id
   * @returns revoked daily item
   */
  async revokeDailyProblemItem(id: string): Promise<DailyProblemItem> {
    const response = await this.httpClient.request<ApiResponse<DailyProblemItem>>({
      method: 'POST',
      url: `/admin/daily-problem-items/${id}/revoke`,
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      id: String(data.id),
      problem: { ...data.problem, id: String(data.problem.id) },
    }
  }

  /**
   * Disable a problem (admin-only operation).
   * @param id problem id
   */
  async disableProblem(id: string): Promise<void> {
    const response = await this.httpClient.request<ApiResponse<unknown>>({
      method: 'POST',
      url: `/admin/problems/${id}/disable`,
    })
    unwrapApiResponse(response)
  }
}
