/**
 * @file File repository port.
 */
import type { PresignedUrlResult, UploadFileResult } from '../models'

export type GetPresignedUrlInput = {
  fileId: string
  expiresSeconds?: number
}

export type FileRepository = {
  upload(file: File): Promise<UploadFileResult>
  getPresignedUrl(input: GetPresignedUrlInput): Promise<PresignedUrlResult>
}
