/**
 * @file Register use case.
 */
import type { AuthRepository, RegisterInput, RegisterResult } from '../ports/authRepository'

export type RegisterUseCase = {
  execute(input: RegisterInput): Promise<RegisterResult>
}

/**
 * Create register use case.
 * @param repository Auth repository
 * @returns register use case
 */
export function createRegisterUseCase(repository: AuthRepository): RegisterUseCase {
  return {
    async execute(input: RegisterInput): Promise<RegisterResult> {
      return repository.register(input)
    },
  }
}
