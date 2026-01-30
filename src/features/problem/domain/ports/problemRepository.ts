/**
 * @file Problem repository port.
 */
import type {
  CreateProblemInput,
  PageResponse,
  ProblemDetail,
  ProblemListQuery,
  ProblemCreateResponse,
  PublishProblemInput,
  ProblemStatusResponse,
  ProblemSummary,
  UpdateProblemInput,
} from '../models'

export type ProblemRepository = {
  list(query: ProblemListQuery): Promise<PageResponse<ProblemSummary>>
  listMine(query: ProblemListQuery): Promise<PageResponse<ProblemSummary>>
  getDetail(id: string): Promise<ProblemDetail>
  getByShareKey(shareKey: string): Promise<ProblemDetail>
  create(input: CreateProblemInput): Promise<ProblemCreateResponse>
  update(id: string, input: UpdateProblemInput): Promise<ProblemStatusResponse>
  publish(id: string, input?: PublishProblemInput): Promise<ProblemStatusResponse>
  disable(id: string): Promise<ProblemStatusResponse>
  delete(id: string): Promise<void>
}
