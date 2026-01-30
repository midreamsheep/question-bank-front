/**
 * @file Create comment use case.
 */

import type { CreateProblemCommentInput } from '../models'
import type { CommentRepository } from '../ports/commentRepository'

export type CreateCommentUseCase = {
  execute(input: CreateProblemCommentInput): Promise<string>
}

export function createCreateCommentUseCase(repository: CommentRepository): CreateCommentUseCase {
  return {
    async execute(input: CreateProblemCommentInput): Promise<string> {
      return repository.create(input)
    },
  }
}
