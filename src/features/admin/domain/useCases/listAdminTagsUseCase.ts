/**
 * @file List admin tags use case.
 */
import type { AdminRepository } from '../ports/adminRepository'
import type { Tag } from '../models'

export type ListAdminTagsUseCase = {
  execute(): Promise<Tag[]>
}

/**
 * Create list admin tags use case.
 * @param repository Admin repository
 * @returns use case
 */
export function createListAdminTagsUseCase(repository: AdminRepository): ListAdminTagsUseCase {
  return {
    async execute(): Promise<Tag[]> {
      return repository.listTags()
    },
  }
}
