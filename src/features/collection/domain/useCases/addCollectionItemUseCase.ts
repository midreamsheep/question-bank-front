/**
 * @file Add collection item use case.
 */
import type { CollectionRepository } from '../ports/collectionRepository'
import type { AddCollectionItemInput } from '../models'

export type AddCollectionItemUseCase = {
  execute(id: string, input: AddCollectionItemInput): Promise<void>
}

/**
 * Create add collection item use case.
 * @param repository Collection repository
 * @returns use case
 */
export function createAddCollectionItemUseCase(
  repository: CollectionRepository,
): AddCollectionItemUseCase {
  return {
    async execute(id: string, input: AddCollectionItemInput): Promise<void> {
      await repository.addItem(id, input)
    },
  }
}
