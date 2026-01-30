/**
 * @file Disable problem use case.
 */
import type { AdminRepository } from '../ports/adminRepository'

export type DisableProblemUseCase = {
  execute(id: string): Promise<void>
}

/**
 * Create disable problem use case.
 * @param repository Admin repository
 * @returns use case
 */
export function createDisableProblemUseCase(repository: AdminRepository): DisableProblemUseCase {
  return {
    async execute(id: string): Promise<void> {
      await repository.disableProblem(id)
    },
  }
}
