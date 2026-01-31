/**
 * @file Collection repository HTTP implementation.
 */
import type { HttpClient } from '../../../infrastructure/http'
import { unwrapApiResponse } from '../../../infrastructure/http'
import type { ApiResponse } from '../../../infrastructure/http'
import type { CollectionRepository } from '../domain/ports/collectionRepository'
import type {
  AddCollectionItemInput,
  CollectionCreateResponse,
  CollectionDetail,
  CollectionListQuery,
  CollectionSummary,
  CreateCollectionInput,
  PageResponse,
  ReorderCollectionInput,
  UpdateCollectionInput,
} from '../domain/models'

export type HttpCollectionRepositoryOptions = {
  httpClient: HttpClient
}

export class HttpCollectionRepository implements CollectionRepository {
  private readonly httpClient: HttpClient

  /**
   * Create HTTP collection repository.
   * @param options repository options
   * @param options.httpClient HTTP client
   */
  constructor(options: HttpCollectionRepositoryOptions) {
    this.httpClient = options.httpClient
  }

  /**
   * List public collections for browsing.
   * @param query - List query.
   * @returns Paged collection summaries.
   */
  async list(query: CollectionListQuery): Promise<PageResponse<CollectionSummary>> {
    const response = await this.httpClient.request<ApiResponse<PageResponse<CollectionSummary>>>(
      {
        method: 'GET',
        url: '/collections',
        query,
      },
    )
    const data = unwrapApiResponse(response)
    return {
      ...data,
      items: data.items.map((item) => ({
        ...item,
        id: String(item.id),
        authorId: String(item.authorId),
      })),
    }
  }

  /**
   * List current user's collections (mine).
   * @param query - List query.
   * @returns Paged collection summaries.
   */
  async listMine(query: CollectionListQuery): Promise<PageResponse<CollectionSummary>> {
    const response = await this.httpClient.request<ApiResponse<PageResponse<CollectionSummary>>>(
      {
        method: 'GET',
        url: '/users/me/collections',
        query: {
          status: query.status,
          page: query.page,
          pageSize: query.pageSize,
        },
      },
    )
    const data = unwrapApiResponse(response)
    return {
      ...data,
      items: data.items.map((item) => ({
        ...item,
        id: String(item.id),
        authorId: String(item.authorId),
      })),
    }
  }

  /**
   * Get collection detail by id.
   * @param id - Collection id.
   * @returns Collection detail.
   */
  async getDetail(id: string): Promise<CollectionDetail> {
    const response = await this.httpClient.request<ApiResponse<CollectionDetail>>({
      method: 'GET',
      url: `/collections/${id}`,
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      id: String(data.id),
      items: data.items?.map((it) => ({
        ...it,
        problemId: String(it.problemId),
        problem: it.problem ? { ...it.problem, id: String(it.problem.id) } : null,
      })),
    }
  }

  /**
   * Get collection detail by share key (public share entry).
   * @param shareKey - Share key.
   * @returns Collection detail.
   */
  async getByShareKey(shareKey: string): Promise<CollectionDetail> {
    const response = await this.httpClient.request<ApiResponse<CollectionDetail>>({
      method: 'GET',
      url: `/collections/share/${shareKey}`,
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      id: String(data.id),
      items: data.items?.map((it) => ({
        ...it,
        problemId: String(it.problemId),
        problem: it.problem ? { ...it.problem, id: String(it.problem.id) } : null,
      })),
    }
  }

  /**
   * Create a new collection.
   * @param input - Create input.
   * @returns Create response.
   */
  async create(input: CreateCollectionInput): Promise<CollectionCreateResponse> {
    const response = await this.httpClient.request<ApiResponse<CollectionCreateResponse>>({
      method: 'POST',
      url: '/collections',
      body: input,
    })
    const data = unwrapApiResponse(response)
    return { ...data, id: String(data.id) }
  }

  /**
   * Update a collection.
   * @param id - Collection id.
   * @param input - Update input.
   * @returns Updated collection detail.
   */
  async update(id: string, input: UpdateCollectionInput): Promise<CollectionDetail> {
    const response = await this.httpClient.request<ApiResponse<CollectionDetail>>({
      method: 'PUT',
      url: `/collections/${id}`,
      body: input,
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      id: String(data.id),
      items: data.items?.map((it) => ({
        ...it,
        problemId: String(it.problemId),
        problem: it.problem ? { ...it.problem, id: String(it.problem.id) } : null,
      })),
    }
  }

  /**
   * Delete a collection.
   * @param id - Collection id.
   * @returns Promise resolved when deletion completes.
   */
  async delete(id: string): Promise<void> {
    const response = await this.httpClient.request<ApiResponse<unknown>>({
      method: 'DELETE',
      url: `/collections/${id}`,
    })
    unwrapApiResponse(response)
  }

  /**
   * Add a problem item into a collection.
   * @param id - Collection id.
   * @param input - Item input.
   * @returns Promise resolved when the operation completes.
   */
  async addItem(id: string, input: AddCollectionItemInput): Promise<void> {
    const response = await this.httpClient.request<ApiResponse<unknown>>({
      method: 'POST',
      url: `/collections/${id}/items`,
      body: input,
    })
    unwrapApiResponse(response)
  }

  /**
   * Reorder collection items.
   * @param id - Collection id.
   * @param input - Reorder input.
   * @returns Promise resolved when the operation completes.
   */
  async reorderItems(id: string, input: ReorderCollectionInput): Promise<void> {
    const response = await this.httpClient.request<ApiResponse<unknown>>({
      method: 'PUT',
      url: `/collections/${id}/items/reorder`,
      body: input,
    })
    unwrapApiResponse(response)
  }
}
