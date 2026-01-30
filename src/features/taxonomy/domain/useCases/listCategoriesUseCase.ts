/**
 * @file List categories use case.
 */
import type { TaxonomyRepository } from '../ports/taxonomyRepository'
import type { Category, TaxonomyQuery } from '../models'

export type ListCategoriesUseCase = {
  execute(query?: TaxonomyQuery): Promise<Category[]>
}

/**
 * Create list categories use case.
 * @param repository Taxonomy repository
 * @returns use case
 */
export function createListCategoriesUseCase(repository: TaxonomyRepository): ListCategoriesUseCase {
  return {
    async execute(query?: TaxonomyQuery): Promise<Category[]> {
      return repository.listCategories(query)
    },
  }
}
