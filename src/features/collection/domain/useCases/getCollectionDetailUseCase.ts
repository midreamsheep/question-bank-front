/**
 * @file Get collection detail use case.
 */
import type { CollectionRepository } from '../ports/collectionRepository'
import type { CollectionDetail } from '../models'

export type GetCollectionDetailUseCase = {
  execute(id: string): Promise<CollectionDetail>
}

/**
 * Create get collection detail use case.
 * @param repository Collection repository
 * @returns use case
 */
export function createGetCollectionDetailUseCase(
  repository: CollectionRepository,
): GetCollectionDetailUseCase {
  return {
    async execute(id: string): Promise<CollectionDetail> {
      return repository.getDetail(id)
    },
  }
}
