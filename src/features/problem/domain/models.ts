/**
 * @file Problem domain models.
 */

// Backend migration (2026-01-29): subject is now a free string (trimmed, max 64 chars).
export type Subject = string

export type ProblemStatus = 'DRAFT' | 'PUBLISHED' | 'DISABLED'

export type Visibility = 'PUBLIC' | 'UNLISTED' | 'PRIVATE'

export type ProblemAuthor = {
  id: string
  nickname?: string | null
  displayName?: string | null
}

export type ProblemTag = {
  id: number
  name: string
}

export type ProblemSummary = {
  id: string
  title: string
  subject: Subject
  difficulty: number
  status: ProblemStatus
  visibility: Visibility
  publishedAt?: string | null
  author?: ProblemAuthor | null
  tagIds?: number[]
  tags?: ProblemTag[]
}

export type ProblemDetail = {
  id: string
  title: string
  subject: Subject
  difficulty: number
  statementFormat: 'MARKDOWN' | 'LATEX'
  statement: string
  solutionFormat?: 'MARKDOWN' | 'LATEX' | null
  solution?: string | null
  visibility: Visibility
  shareKey?: string | null
  status: ProblemStatus
  publishedAt?: string | null
  author?: ProblemAuthor | null
  tagIds?: number[]
  tags?: ProblemTag[]
}

export type ProblemPayload = {
  title: string
  subject: Subject
  difficulty: number
  statementFormat: 'MARKDOWN' | 'LATEX'
  statement: string
  solutionFormat?: 'MARKDOWN' | 'LATEX' | null
  solution?: string | null
  visibility: Visibility
  tagIds: number[]
}

export type CreateProblemInput = ProblemPayload

export type UpdateProblemInput = ProblemPayload

export type PublishProblemInput = {
  subject?: Subject
  tagIds?: number[]
  newTags?: string[]
}

export type ProblemCreateResponse = {
  id: string
  status: ProblemStatus
  visibility: Visibility
  shareKey?: string | null
}

export type ProblemStatusResponse = {
  id: string
  status: ProblemStatus
  visibility: Visibility
  shareKey?: string | null
}

export type ProblemListQuery = {
  status?: ProblemStatus
  authorId?: string
  subject?: Subject
  tagIds?: number[]
  difficultyMin?: number
  difficultyMax?: number
  keyword?: string
  sort?: string
  page?: number
  pageSize?: number
}

export type PageResponse<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}
