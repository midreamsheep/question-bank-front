/**
 * @file Create category use case.
 */
import type { AdminRepository } from '../ports/adminRepository'
import type { Category, CreateCategoryInput } from '../models'

export type CreateCategoryUseCase = {
  execute(input: CreateCategoryInput): Promise<Category>
}

/**
 * Create create-category use case.
 * @param repository Admin repository
 * @returns use case
 */
export function createCreateCategoryUseCase(repository: AdminRepository): CreateCategoryUseCase {
  return {
    async execute(input: CreateCategoryInput): Promise<Category> {
      return repository.createCategory(input)
    },
  }
}
