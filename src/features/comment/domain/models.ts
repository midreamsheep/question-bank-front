/**
 * @file Comment domain models.
 */

export type ProblemComment = {
  id: string
  problemId: string
  userId: string
  parentId?: string | null
  replyToCommentId?: string | null
  content?: string | null
  likeCount: number
  deleted: boolean
  createdAt: string
}

export type CreateProblemCommentInput = {
  problemId: string
  parentId: string | null
  replyToCommentId?: string | null
  content: string
}

export type ListProblemCommentsQuery = {
  problemId: string
  parentId?: string | null
  page?: number
  pageSize?: number
}

export type PageResponse<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}
