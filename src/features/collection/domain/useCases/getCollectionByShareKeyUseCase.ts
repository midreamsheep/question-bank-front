/**
 * @file Get collection by share key use case.
 */
import type { CollectionRepository } from '../ports/collectionRepository'
import type { CollectionDetail } from '../models'

export type GetCollectionByShareKeyUseCase = {
  execute(shareKey: string): Promise<CollectionDetail>
}

/**
 * Create get collection by share key use case.
 * @param repository Collection repository
 * @returns use case
 */
export function createGetCollectionByShareKeyUseCase(
  repository: CollectionRepository,
): GetCollectionByShareKeyUseCase {
  return {
    async execute(shareKey: string): Promise<CollectionDetail> {
      return repository.getByShareKey(shareKey)
    },
  }
}
