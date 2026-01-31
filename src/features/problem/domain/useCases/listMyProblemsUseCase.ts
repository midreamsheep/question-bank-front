/**
 * @file List my problems use case.
 */

import type { PageResponse, ProblemListQuery, ProblemSummary } from '../models'
import type { ProblemRepository } from '../ports/problemRepository'

export type ListMyProblemsUseCase = {
  execute(query: ProblemListQuery): Promise<PageResponse<ProblemSummary>>
}

/**
 * Create list-my-problems use case.
 * @param repository - Problem repository.
 * @returns Use case implementation.
 */
export function createListMyProblemsUseCase(repository: ProblemRepository): ListMyProblemsUseCase {
  return {
    async execute(query: ProblemListQuery): Promise<PageResponse<ProblemSummary>> {
      return repository.listMine(query)
    },
  }
}
