/**
 * @file List collections use case.
 */
import type { CollectionRepository } from '../ports/collectionRepository'
import type { CollectionListQuery, CollectionSummary, PageResponse } from '../models'

export type ListCollectionsUseCase = {
  execute(query: CollectionListQuery): Promise<PageResponse<CollectionSummary>>
}

/**
 * Create list collections use case.
 * @param repository Collection repository
 * @returns use case
 */
export function createListCollectionsUseCase(
  repository: CollectionRepository,
): ListCollectionsUseCase {
  return {
    async execute(query: CollectionListQuery): Promise<PageResponse<CollectionSummary>> {
      return repository.list(query)
    },
  }
}
