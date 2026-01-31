/**
 * @file File repository port.
 */
import type { ShareKeyResult, UploadFileResult } from '../models'

export type GetShareKeyInput = {
  fileId: string
}

export type FileRepository = {
  upload(file: File): Promise<UploadFileResult>
  getShareKey(input: GetShareKeyInput): Promise<ShareKeyResult>
}
