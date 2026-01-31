/**
 * @file File repository HTTP implementation.
 */
import type { HttpClient } from '../../../infrastructure/http'
import { unwrapApiResponse } from '../../../infrastructure/http'
import type { ApiResponse } from '../../../infrastructure/http'
import type { FileRepository } from '../domain/ports/fileRepository'
import type { ShareKeyResult, UploadFileResult } from '../domain/models'
import type { GetShareKeyInput } from '../domain/ports/fileRepository'

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

  /**
   * Upload a file.
   * @param file - File to upload.
   * @returns Upload result containing id and shareKey.
   */
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

  /**
   * Resolve shareKey by fileId.
   * @param input - Share key query input.
   * @returns Share key result.
   */
  async getShareKey(input: GetShareKeyInput): Promise<ShareKeyResult> {
    const response = await this.httpClient.request<ApiResponse<ShareKeyResult>>({
      method: 'GET',
      url: '/files/share-url',
      query: {
        fileId: input.fileId,
      },
    })
    return unwrapApiResponse(response)
  }
}
