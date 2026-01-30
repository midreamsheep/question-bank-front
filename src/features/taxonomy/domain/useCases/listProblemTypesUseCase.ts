/**
 * @file List problem types use case.
 */
import type { TaxonomyRepository } from '../ports/taxonomyRepository'
import type { ProblemType, TaxonomyQuery } from '../models'

export type ListProblemTypesUseCase = {
  execute(query?: TaxonomyQuery): Promise<ProblemType[]>
}

/**
 * Create list problem types use case.
 * @param repository Taxonomy repository
 * @returns use case
 */
export function createListProblemTypesUseCase(
  repository: TaxonomyRepository,
): ListProblemTypesUseCase {
  return {
    async execute(query?: TaxonomyQuery): Promise<ProblemType[]> {
      return repository.listProblemTypes(query)
    },
  }
}
