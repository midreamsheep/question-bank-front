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

  async create(input: CreateCollectionInput): Promise<CollectionCreateResponse> {
    const response = await this.httpClient.request<ApiResponse<CollectionCreateResponse>>({
      method: 'POST',
      url: '/collections',
      body: input,
    })
    const data = unwrapApiResponse(response)
    return { ...data, id: String(data.id) }
  }

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

  async delete(id: string): Promise<void> {
    const response = await this.httpClient.request<ApiResponse<unknown>>({
      method: 'DELETE',
      url: `/collections/${id}`,
    })
    unwrapApiResponse(response)
  }

  async addItem(id: string, input: AddCollectionItemInput): Promise<void> {
    const response = await this.httpClient.request<ApiResponse<unknown>>({
      method: 'POST',
      url: `/collections/${id}/items`,
      body: input,
    })
    unwrapApiResponse(response)
  }

  async reorderItems(id: string, input: ReorderCollectionInput): Promise<void> {
    const response = await this.httpClient.request<ApiResponse<unknown>>({
      method: 'PUT',
      url: `/collections/${id}/items/reorder`,
      body: input,
    })
    unwrapApiResponse(response)
  }
}
