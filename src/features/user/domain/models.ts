/**
 * @file User domain models.
 */

export type UserStatus = 'ACTIVE' | 'DISABLED'

export type UserProfile = {
  id: string
  username: string
  nickname?: string | null
  avatarFileId?: string | null
  status: UserStatus
}

export type UpdateUserProfileInput = {
  nickname: string
  avatarFileId: string | null
}

export type ChangePasswordInput = {
  oldPassword: string
  newPassword: string
}

export type UserStats = {
  problemCountByStatus: {
    DRAFT: number
    PUBLISHED: number
    DISABLED: number
  }
  collectionCount: number
}
