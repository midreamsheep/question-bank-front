/**
 * @file Create tag use case.
 */
import type { AdminRepository } from '../ports/adminRepository'
import type { CreateTagInput, Tag } from '../models'

export type CreateTagUseCase = {
  execute(input: CreateTagInput): Promise<Tag>
}

/**
 * Create create-tag use case.
 * @param repository Admin repository
 * @returns use case
 */
export function createCreateTagUseCase(repository: AdminRepository): CreateTagUseCase {
  return {
    async execute(input: CreateTagInput): Promise<Tag> {
      return repository.createTag(input)
    },
  }
}
