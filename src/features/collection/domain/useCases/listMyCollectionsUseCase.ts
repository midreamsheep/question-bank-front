/**
 * @file List my collections use case.
 */

import type { CollectionListQuery, CollectionSummary, PageResponse } from '../models'
import type { CollectionRepository } from '../ports/collectionRepository'

export type ListMyCollectionsUseCase = {
  execute(query: CollectionListQuery): Promise<PageResponse<CollectionSummary>>
}

export function createListMyCollectionsUseCase(
  repository: CollectionRepository,
): ListMyCollectionsUseCase {
  return {
    async execute(query: CollectionListQuery): Promise<PageResponse<CollectionSummary>> {
      return repository.listMine(query)
    },
  }
}

