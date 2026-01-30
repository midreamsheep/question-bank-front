/**
 * @file Problem repository HTTP implementation.
 */
import type { HttpClient } from '../../../infrastructure/http'
import { unwrapApiResponse } from '../../../infrastructure/http'
import type { ApiResponse } from '../../../infrastructure/http'
import type { ProblemRepository } from '../domain/ports/problemRepository'
import type {
  CreateProblemInput,
  PageResponse,
  ProblemCreateResponse,
  ProblemDetail,
  ProblemListQuery,
  PublishProblemInput,
  ProblemStatusResponse,
  ProblemSummary,
  ProblemTag,
  UpdateProblemInput,
} from '../domain/models'

export type HttpProblemRepositoryOptions = {
  httpClient: HttpClient
}

export class HttpProblemRepository implements ProblemRepository {
  private readonly httpClient: HttpClient

  /**
   * Create HTTP problem repository.
   * @param options repository options
   * @param options.httpClient HTTP client
   */
  constructor(options: HttpProblemRepositoryOptions) {
    this.httpClient = options.httpClient
  }

  private mapTags(tags?: Array<{ id: unknown; name: unknown }> | null): ProblemTag[] | undefined {
    if (!tags) return undefined
    return tags
      .map((t) => ({
        id: Number((t as { id?: unknown }).id),
        name: String((t as { name?: unknown }).name ?? ''),
      }))
      .filter((t) => Number.isFinite(t.id) && t.name.trim().length > 0)
  }

  async list(query: ProblemListQuery): Promise<PageResponse<ProblemSummary>> {
    const response = await this.httpClient.request<ApiResponse<PageResponse<ProblemSummary>>>({
      method: 'GET',
      url: '/problems',
      query,
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      items: data.items.map((item) => ({
        ...item,
        id: String(item.id),
        author: item.author ? { ...item.author, id: String(item.author.id) } : null,
        tagIds: Array.isArray((item as ProblemSummary).tagIds)
          ? (item as ProblemSummary).tagIds
          : ((item as unknown as { tagIds?: unknown }).tagIds as number[] | undefined),
        tags: this.mapTags((item as unknown as { tags?: Array<{ id: unknown; name: unknown }> | null }).tags ?? null),
      })),
    }
  }

  async listMine(query: ProblemListQuery): Promise<PageResponse<ProblemSummary>> {
    const response = await this.httpClient.request<ApiResponse<PageResponse<ProblemSummary>>>({
      method: 'GET',
      url: '/users/me/problems',
      query: {
        status: query.status,
        page: query.page,
        pageSize: query.pageSize,
      },
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      items: data.items.map((item) => ({
        ...item,
        id: String(item.id),
        author: item.author ? { ...item.author, id: String(item.author.id) } : null,
        tags: this.mapTags((item as unknown as { tags?: Array<{ id: unknown; name: unknown }> | null }).tags ?? null),
      })),
    }
  }

  async getDetail(id: string): Promise<ProblemDetail> {
    const response = await this.httpClient.request<ApiResponse<ProblemDetail>>({
      method: 'GET',
      url: `/problems/${id}`,
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      id: String(data.id),
      author: data.author ? { ...data.author, id: String(data.author.id) } : null,
      tags: this.mapTags((data as unknown as { tags?: Array<{ id: unknown; name: unknown }> | null }).tags ?? null),
    }
  }

  async getByShareKey(shareKey: string): Promise<ProblemDetail> {
    const response = await this.httpClient.request<ApiResponse<ProblemDetail>>({
      method: 'GET',
      url: `/problems/share/${shareKey}`,
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      id: String(data.id),
      author: data.author ? { ...data.author, id: String(data.author.id) } : null,
      tags: this.mapTags((data as unknown as { tags?: Array<{ id: unknown; name: unknown }> | null }).tags ?? null),
    }
  }

  async create(input: CreateProblemInput): Promise<ProblemCreateResponse> {
    const response = await this.httpClient.request<ApiResponse<ProblemCreateResponse>>({
      method: 'POST',
      url: '/problems',
      body: input,
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      id: String(data.id),
    }
  }

  async update(id: string, input: UpdateProblemInput): Promise<ProblemStatusResponse> {
    const response = await this.httpClient.request<ApiResponse<ProblemStatusResponse>>({
      method: 'PUT',
      url: `/problems/${id}`,
      body: input,
    })
    const data = unwrapApiResponse(response)
    return { ...data, id: String(data.id) }
  }

  async publish(id: string, input?: PublishProblemInput): Promise<ProblemStatusResponse> {
    const response = await this.httpClient.request<ApiResponse<ProblemStatusResponse>>({
      method: 'POST',
      url: `/problems/${id}/publish`,
      body: input && Object.keys(input).length ? input : undefined,
    })
    const data = unwrapApiResponse(response)
    return { ...data, id: String(data.id) }
  }

  async disable(id: string): Promise<ProblemStatusResponse> {
    const response = await this.httpClient.request<ApiResponse<ProblemStatusResponse>>({
      method: 'POST',
      url: `/problems/${id}/disable`,
    })
    const data = unwrapApiResponse(response)
    return { ...data, id: String(data.id) }
  }

  async delete(id: string): Promise<void> {
    const response = await this.httpClient.request<ApiResponse<unknown>>({
      method: 'DELETE',
      url: `/problems/${id}`,
    })
    unwrapApiResponse(response)
  }
}
