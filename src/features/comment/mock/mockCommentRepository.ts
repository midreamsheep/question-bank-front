/**
 * @file Mock comment repository.
 */

import type { CommentRepository } from '../domain/ports/commentRepository'
import type {
  CreateProblemCommentInput,
  ListProblemCommentsQuery,
  PageResponse,
  ProblemComment,
} from '../domain/models'
import { mockStore } from '../../../infrastructure/mock/mockStore'

export class MockCommentRepository implements CommentRepository {
  async list(query: ListProblemCommentsQuery): Promise<PageResponse<ProblemComment>> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const all = mockStore.comments
      .filter((c) => c.problemId === query.problemId)
      .filter((c) => (query.parentId === undefined ? c.parentId === null : c.parentId === query.parentId))
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const total = all.length
    const start = (page - 1) * pageSize
    const items = all.slice(start, start + pageSize).map((c) => ({ ...c }))
    return { items, page, pageSize, total }
  }

  async create(input: CreateProblemCommentInput): Promise<string> {
    const content = input.content.trim()
    if (!content) throw new Error('评论内容不能为空。')
    const id = String(mockStore.nextCommentId++)
    const created: ProblemComment = {
      id,
      problemId: input.problemId,
      userId: mockStore.user.id,
      parentId: input.parentId,
      replyToCommentId: input.replyToCommentId ?? null,
      content: content,
      likeCount: 0,
      deleted: false,
      createdAt: new Date().toISOString(),
    }
    mockStore.comments.unshift(created)
    return id
  }
}
