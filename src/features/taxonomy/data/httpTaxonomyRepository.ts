/**
 * @file Taxonomy repository HTTP implementation.
 */
import type { HttpClient } from '../../../infrastructure/http'
import { unwrapApiResponse } from '../../../infrastructure/http'
import type { ApiResponse } from '../../../infrastructure/http'
import type { TaxonomyRepository } from '../domain/ports/taxonomyRepository'
import type { Category, ProblemType, Tag, TaxonomyQuery } from '../domain/models'

export type HttpTaxonomyRepositoryOptions = {
  httpClient: HttpClient
}

export class HttpTaxonomyRepository implements TaxonomyRepository {
  private readonly httpClient: HttpClient

  /**
   * Create HTTP taxonomy repository.
   * @param options repository options
   * @param options.httpClient HTTP client
   */
  constructor(options: HttpTaxonomyRepositoryOptions) {
    this.httpClient = options.httpClient
  }

  /**
   * List categories.
   * @param query - Optional taxonomy query.
   * @returns Categories list.
   */
  async listCategories(query?: TaxonomyQuery): Promise<Category[]> {
    const response = await this.httpClient.request<ApiResponse<Category[]>>({
      method: 'GET',
      url: '/categories',
      query,
    })
    return unwrapApiResponse(response)
  }

  /**
   * List problem types.
   * @param query - Optional taxonomy query.
   * @returns Problem types list.
   */
  async listProblemTypes(query?: TaxonomyQuery): Promise<ProblemType[]> {
    const response = await this.httpClient.request<ApiResponse<ProblemType[]>>({
      method: 'GET',
      url: '/problem-types',
      query,
    })
    return unwrapApiResponse(response)
  }

  /**
   * List tags.
   * @param query - Optional taxonomy query.
   * @returns Tags list.
   */
  async listTags(query?: TaxonomyQuery): Promise<Tag[]> {
    const response = await this.httpClient.request<ApiResponse<Tag[]>>({
      method: 'GET',
      url: '/tags',
      query,
    })
    return unwrapApiResponse(response)
  }
}
