/**
 * @file Update collection use case.
 */

import type { CollectionDetail, UpdateCollectionInput } from '../models'
import type { CollectionRepository } from '../ports/collectionRepository'

export type UpdateCollectionUseCase = {
  execute(id: string, input: UpdateCollectionInput): Promise<CollectionDetail>
}

/**
 * Create update-collection use case.
 * @param repository - Collection repository.
 * @returns Use case implementation.
 */
export function createUpdateCollectionUseCase(
  repository: CollectionRepository,
): UpdateCollectionUseCase {
  return {
    async execute(id: string, input: UpdateCollectionInput): Promise<CollectionDetail> {
      return repository.update(id, input)
    },
  }
}
