/**
 * @file File repository HTTP implementation.
 */
import type { HttpClient } from '../../../infrastructure/http'
import { unwrapApiResponse } from '../../../infrastructure/http'
import type { ApiResponse } from '../../../infrastructure/http'
import type { FileRepository } from '../domain/ports/fileRepository'
import type { PresignedUrlResult, UploadFileResult } from '../domain/models'
import type { GetPresignedUrlInput } from '../domain/ports/fileRepository'

export type HttpFileRepositoryOptions = {
  httpClient: HttpClient
}

export class HttpFileRepository implements FileRepository {
  private readonly httpClient: HttpClient

  /**
   * Create HTTP file repository.
   * @param options repository options
   * @param options.httpClient HTTP client
   */
  constructor(options: HttpFileRepositoryOptions) {
    this.httpClient = options.httpClient
  }

  async upload(file: File): Promise<UploadFileResult> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.httpClient.request<ApiResponse<UploadFileResult>>({
      method: 'POST',
      url: '/files',
      body: formData,
    })
    const data = unwrapApiResponse(response)
    return {
      ...data,
      id: String(data.id),
    }
  }

  async getPresignedUrl(input: GetPresignedUrlInput): Promise<PresignedUrlResult> {
    const response = await this.httpClient.request<ApiResponse<PresignedUrlResult>>({
      method: 'GET',
      url: '/files/presigned-get-url',
      query: {
        fileId: input.fileId,
        expiresSeconds: input.expiresSeconds,
      },
    })
    return unwrapApiResponse(response)
  }
}
