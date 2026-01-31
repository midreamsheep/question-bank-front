/**
 * @file List my collections use case.
 */

import type { CollectionListQuery, CollectionSummary, PageResponse } from '../models'
import type { CollectionRepository } from '../ports/collectionRepository'

export type ListMyCollectionsUseCase = {
  execute(query: CollectionListQuery): Promise<PageResponse<CollectionSummary>>
}

/**
 * Create list-my-collections use case.
 * @param repository - Collection repository.
 * @returns Use case implementation.
 */
export function createListMyCollectionsUseCase(
  repository: CollectionRepository,
): ListMyCollectionsUseCase {
  return {
    async execute(query: CollectionListQuery): Promise<PageResponse<CollectionSummary>> {
      return repository.listMine(query)
    },
  }
}
