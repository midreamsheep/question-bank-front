/**
 * @file Auth repository HTTP implementation.
 */
import type { HttpClient } from '../../../infrastructure/http'
import { unwrapApiResponse } from '../../../infrastructure/http'
import type { ApiResponse } from '../../../infrastructure/http'
import type {
  AuthRepository,
  LoginInput,
  LoginResult,
  RegisterInput,
  RegisterResult,
} from '../domain/ports/authRepository'

export type HttpAuthRepositoryOptions = {
  httpClient: HttpClient
}

export class HttpAuthRepository implements AuthRepository {
  private readonly httpClient: HttpClient

  /**
   * Create HTTP auth repository.
   * @param options repository options
   * @param options.httpClient HTTP client
   */
  constructor(options: HttpAuthRepositoryOptions) {
    this.httpClient = options.httpClient
  }

  /**
   * Login by username/password.
   * @param input - Login input.
   * @returns Login result.
   */
  async login(input: LoginInput): Promise<LoginResult> {
    const response = await this.httpClient.request<ApiResponse<LoginResult>>({
      method: 'POST',
      url: '/auth/login',
      body: input,
    })
    return unwrapApiResponse(response)
  }

  /**
   * Register a new user.
   * @param input - Register input.
   * @returns Register result.
   */
  async register(input: RegisterInput): Promise<RegisterResult> {
    const response = await this.httpClient.request<ApiResponse<RegisterResult>>({
      method: 'POST',
      url: '/auth/register',
      body: input,
    })
    return unwrapApiResponse(response)
  }

  /**
   * Logout current session.
   * @returns Promise resolved when logout completes.
   */
  async logout(): Promise<void> {
    const response = await this.httpClient.request<ApiResponse<unknown>>({
      method: 'POST',
      url: '/auth/logout',
    })
    unwrapApiResponse(response)
  }
}
