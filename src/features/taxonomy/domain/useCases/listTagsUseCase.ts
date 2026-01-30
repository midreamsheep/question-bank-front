/**
 * @file List tags use case.
 */
import type { TaxonomyRepository } from '../ports/taxonomyRepository'
import type { Tag, TaxonomyQuery } from '../models'

export type ListTagsUseCase = {
  execute(query?: TaxonomyQuery): Promise<Tag[]>
}

/**
 * Create list tags use case.
 * @param repository Taxonomy repository
 * @returns use case
 */
export function createListTagsUseCase(repository: TaxonomyRepository): ListTagsUseCase {
  return {
    async execute(query?: TaxonomyQuery): Promise<Tag[]> {
      return repository.listTags(query)
    },
  }
}
