/**
 * @file Create collection use case.
 */
import type { CollectionRepository } from '../ports/collectionRepository'
import type { CollectionCreateResponse, CreateCollectionInput } from '../models'

export type CreateCollectionUseCase = {
  execute(input: CreateCollectionInput): Promise<CollectionCreateResponse>
}

/**
 * Create create-collection use case.
 * @param repository Collection repository
 * @returns use case
 */
export function createCreateCollectionUseCase(
  repository: CollectionRepository,
): CreateCollectionUseCase {
  return {
    async execute(input: CreateCollectionInput): Promise<CollectionCreateResponse> {
      return repository.create(input)
    },
  }
}
