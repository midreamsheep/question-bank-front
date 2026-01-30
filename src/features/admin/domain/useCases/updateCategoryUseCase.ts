/**
 * @file Update category use case.
 */
import type { AdminRepository } from '../ports/adminRepository'
import type { Category, UpdateCategoryInput } from '../models'

export type UpdateCategoryUseCase = {
  execute(id: number, input: UpdateCategoryInput): Promise<Category>
}

/**
 * Create update-category use case.
 * @param repository Admin repository
 * @returns use case
 */
export function createUpdateCategoryUseCase(repository: AdminRepository): UpdateCategoryUseCase {
  return {
    async execute(id: number, input: UpdateCategoryInput): Promise<Category> {
      return repository.updateCategory(id, input)
    },
  }
}
