/**
 * @file Auth repository port.
 */

export type LoginInput = {
  username: string
  password: string
}

export type LoginResult = {
  token: string
}

export type RegisterInput = {
  username: string
  password: string
  nickname: string
}

export type RegisterResult = {
  userId: number
  token: string
}

export type AuthRepository = {
  login(input: LoginInput): Promise<LoginResult>
  register(input: RegisterInput): Promise<RegisterResult>
  logout(): Promise<void>
}
