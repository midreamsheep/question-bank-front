/**
 * @file List comments use case.
 */

import type { ListProblemCommentsQuery, PageResponse, ProblemComment } from '../models'
import type { CommentRepository } from '../ports/commentRepository'

export type ListCommentsUseCase = {
  execute(query: ListProblemCommentsQuery): Promise<PageResponse<ProblemComment>>
}

export function createListCommentsUseCase(repository: CommentRepository): ListCommentsUseCase {
  return {
    async execute(query: ListProblemCommentsQuery): Promise<PageResponse<ProblemComment>> {
      return repository.list(query)
    },
  }
}
