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
  /**
   * Login (mock): returns a synthetic token.
   * @param input - Login input.
   * @returns Login result.
   */
  async login(input: LoginInput): Promise<LoginResult> {
    return {
      token: `mock-token-${input.username}`,
    }
  }

  /**
   * Register (mock): returns a synthetic userId and token.
   * @param input - Register input.
   * @returns Register result.
   */
  async register(input: RegisterInput): Promise<RegisterResult> {
    return {
      userId: 1,
      token: `mock-token-${input.username}`,
    }
  }

  /**
   * Logout (mock): no-op.
   * @returns Promise resolved immediately.
   */
  async logout(): Promise<void> {
    // Stateless: no-op for mock.
  }
}
