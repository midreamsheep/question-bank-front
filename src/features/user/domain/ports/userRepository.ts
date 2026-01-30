/**
 * @file User repository port definition.
 */

import type { ChangePasswordInput, UpdateUserProfileInput, UserProfile, UserStats } from '../models'

export type UserRepository = {
  getMe(): Promise<UserProfile>
  getById(id: string): Promise<UserProfile>
  updateProfile(input: UpdateUserProfileInput): Promise<UserProfile>
  changePassword(input: ChangePasswordInput): Promise<void>
  getStats(): Promise<UserStats>
}
