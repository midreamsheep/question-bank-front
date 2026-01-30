/**
 * @file Mock auth repository.
 */
import type {
  AuthRepository,
  LoginInput,
  LoginResult,
  RegisterInput,
  RegisterResult,
} from '../domain/ports/authRepository'

export class MockAuthRepository implements AuthRepository {
  async login(input: LoginInput): Promise<LoginResult> {
    return {
      token: `mock-token-${input.username}`,
    }
  }

  async register(input: RegisterInput): Promise<RegisterResult> {
    return {
      userId: 1,
      token: `mock-token-${input.username}`,
    }
  }

  async logout(): Promise<void> {
    // Stateless: no-op for mock.
  }
}
