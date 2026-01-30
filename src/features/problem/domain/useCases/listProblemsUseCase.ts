/**
 * @file List problems use case.
 */
import type { ProblemRepository } from '../ports/problemRepository'
import type { PageResponse, ProblemListQuery, ProblemSummary } from '../models'

export type ListProblemsUseCase = {
  execute(query: ProblemListQuery): Promise<PageResponse<ProblemSummary>>
}

/**
 * Create list problems use case.
 * @param repository Problem repository
 * @returns use case
 */
export function createListProblemsUseCase(repository: ProblemRepository): ListProblemsUseCase {
  return {
    async execute(query: ProblemListQuery): Promise<PageResponse<ProblemSummary>> {
      return repository.list(query)
    },
  }
}
