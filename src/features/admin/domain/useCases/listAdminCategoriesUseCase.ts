/**
 * @file List admin categories use case.
 */
import type { AdminRepository } from '../ports/adminRepository'
import type { Category } from '../models'

export type ListAdminCategoriesUseCase = {
  execute(): Promise<Category[]>
}

/**
 * Create list admin categories use case.
 * @param repository Admin repository
 * @returns use case
 */
export function createListAdminCategoriesUseCase(
  repository: AdminRepository,
): ListAdminCategoriesUseCase {
  return {
    async execute(): Promise<Category[]> {
      return repository.listCategories()
    },
  }
}
