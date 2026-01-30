/**
 * @file Update collection use case.
 */

import type { CollectionDetail, UpdateCollectionInput } from '../models'
import type { CollectionRepository } from '../ports/collectionRepository'

export type UpdateCollectionUseCase = {
  execute(id: string, input: UpdateCollectionInput): Promise<CollectionDetail>
}

export function createUpdateCollectionUseCase(
  repository: CollectionRepository,
): UpdateCollectionUseCase {
  return {
    async execute(id: string, input: UpdateCollectionInput): Promise<CollectionDetail> {
      return repository.update(id, input)
    },
  }
}
