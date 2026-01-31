/**
 * @file File domain models.
 */

export type UploadFileResult = {
  id: string
  shareKey: string
  originalFilename: string
  size: number
  contentType: string
}

export type ShareKeyResult = {
  shareKey: string
}
