/**
 * @file Comment repository HTTP implementation.
 */

import type { HttpClient } from '../../../infrastructure/http'
import { unwrapApiResponse } from '../../../infrastructure/http'
import type { ApiResponse } from '../../../infrastructure/http'
import type { CommentRepository } from '../domain/ports/commentRepository'
import type {
  CreateProblemCommentInput,
  ListProblemCommentsQuery,
  PageResponse,
  ProblemComment,
} from '../domain/models'

export type HttpCommentRepositoryOptions = {
  httpClient: HttpClient
}

export class HttpCommentRepository implements CommentRepository {
  private readonly httpClient: HttpClient

  constructor(options: HttpCommentRepositoryOptions) {
    this.httpClient = options.httpClient
  }

  async list(query: ListProblemCommentsQuery): Promise<PageResponse<ProblemComment>> {
    const response = await this.httpClient.request<ApiResponse<PageResponse<ProblemComment>>>({
      method: 'GET',
      url: `/problems/${query.problemId}/comments`,
      query: {
        parentId: query.parentId ?? undefined,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      },
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      items: data.items.map((c) => ({
        ...c,
        id: String(c.id),
        problemId: String(c.problemId),
        userId: String(c.userId),
        parentId: c.parentId === null || c.parentId === undefined ? null : String(c.parentId),
        replyToCommentId: c.replyToCommentId === null || c.replyToCommentId === undefined ? null : String(c.replyToCommentId),
      })),
    }
  }

  async create(input: CreateProblemCommentInput): Promise<string> {
    const response = await this.httpClient.request<ApiResponse<unknown>>({
      method: 'POST',
      url: `/problems/${input.problemId}/comments`,
      body: {
        parentId: input.parentId,
        replyToCommentId: input.replyToCommentId ?? null,
        content: input.content,
      },
    })
    return String(unwrapApiResponse(response))
  }
}
