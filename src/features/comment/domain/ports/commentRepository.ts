/**
 * @file Comment repository port.
 */

import type {
  CreateProblemCommentInput,
  ListProblemCommentsQuery,
  PageResponse,
  ProblemComment,
} from '../models'

export type CommentRepository = {
  list(query: ListProblemCommentsQuery): Promise<PageResponse<ProblemComment>>
  create(input: CreateProblemCommentInput): Promise<string>
}
