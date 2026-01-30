/**
 * @file Reorder collection items use case.
 */
import type { CollectionRepository } from '../ports/collectionRepository'
import type { ReorderCollectionInput } from '../models'

export type ReorderCollectionItemsUseCase = {
  execute(id: string, input: ReorderCollectionInput): Promise<void>
}

/**
 * Create reorder collection items use case.
 * @param repository Collection repository
 * @returns use case
 */
export function createReorderCollectionItemsUseCase(
  repository: CollectionRepository,
): ReorderCollectionItemsUseCase {
  return {
    async execute(id: string, input: ReorderCollectionInput): Promise<void> {
      await repository.reorderItems(id, input)
    },
  }
}
