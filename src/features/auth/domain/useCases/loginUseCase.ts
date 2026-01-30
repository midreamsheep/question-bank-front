/**
 * @file Login use case.
 */
import type { AuthRepository, LoginInput, LoginResult } from '../ports/authRepository'

export type LoginUseCase = {
  execute(input: LoginInput): Promise<LoginResult>
}

/**
 * Create login use case.
 * @param repository Auth repository
 * @returns login use case
 */
export function createLoginUseCase(repository: AuthRepository): LoginUseCase {
  return {
    async execute(input: LoginInput): Promise<LoginResult> {
      return repository.login(input)
    },
  }
}
