/**
 * @file File domain models.
 */

export type UploadFileResult = {
  id: string
  shareKey: string
  shareUrl: string
  objectKey: string
  originalFilename: string
  size: number
  contentType: string
}

export type PresignedUrlResult = {
  url: string
}
