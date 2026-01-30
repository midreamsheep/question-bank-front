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

  async listCategories(): Promise<Category[]> {
    const response = await this.httpClient.request<ApiResponse<Category[]>>({
      method: 'GET',
      url: '/categories',
    })
    return unwrapApiResponse(response)
  }

  async listProblemTypes(): Promise<ProblemType[]> {
    const response = await this.httpClient.request<ApiResponse<ProblemType[]>>({
      method: 'GET',
      url: '/problem-types',
    })
    return unwrapApiResponse(response)
  }

  async listTags(): Promise<Tag[]> {
    const response = await this.httpClient.request<ApiResponse<Tag[]>>({
      method: 'GET',
      url: '/tags',
    })
    return unwrapApiResponse(response)
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const response = await this.httpClient.request<ApiResponse<Category>>({
      method: 'POST',
      url: '/admin/categories',
      body: input,
    })
    return unwrapApiResponse(response)
  }

  async updateCategory(id: number, input: UpdateCategoryInput): Promise<Category> {
    const response = await this.httpClient.request<ApiResponse<Category>>({
      method: 'PUT',
      url: `/admin/categories/${id}`,
      body: input,
    })
    return unwrapApiResponse(response)
  }

  async createProblemType(input: CreateProblemTypeInput): Promise<ProblemType> {
    const response = await this.httpClient.request<ApiResponse<ProblemType>>({
      method: 'POST',
      url: '/admin/problem-types',
      body: input,
    })
    return unwrapApiResponse(response)
  }

  async updateProblemType(id: number, input: UpdateProblemTypeInput): Promise<ProblemType> {
    const response = await this.httpClient.request<ApiResponse<ProblemType>>({
      method: 'PUT',
      url: `/admin/problem-types/${id}`,
      body: input,
    })
    return unwrapApiResponse(response)
  }

  async createTag(input: CreateTagInput): Promise<Tag> {
    const response = await this.httpClient.request<ApiResponse<Tag>>({
      method: 'POST',
      url: '/admin/tags',
      body: input,
    })
    return unwrapApiResponse(response)
  }

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

  async disableProblem(id: string): Promise<void> {
    const response = await this.httpClient.request<ApiResponse<unknown>>({
      method: 'POST',
      url: `/admin/problems/${id}/disable`,
    })
    unwrapApiResponse(response)
  }
}
