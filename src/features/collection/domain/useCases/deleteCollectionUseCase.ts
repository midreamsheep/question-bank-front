/**
 * @file Delete collection use case.
 */

import type { CollectionRepository } from '../ports/collectionRepository'

export type DeleteCollectionUseCase = {
  execute(id: string): Promise<void>
}

/**
 * Create delete-collection use case.
 * @param repository - Collection repository.
 * @returns Use case implementation.
 */
export function createDeleteCollectionUseCase(repository: CollectionRepository): DeleteCollectionUseCase {
  return {
    async execute(id: string): Promise<void> {
      return repository.delete(id)
    },
  }
}
